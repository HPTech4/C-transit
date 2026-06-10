"use strict";

import { prisma, isBelowThreshold } from "./ledger.service.js";
import type { Prisma } from "@prisma/client";
import logger from "../config/logger.js";
import {
  parseTransactionBatch,
  buildDeltaCommand,
  type ParsedTransaction,
} from "../utils/parser.js";
import { broadcastDeltaToFleet } from "./sync.service.js";
import { publishToTerminal } from "../mqtt/downlinkQueue.js";

type LoggerInstance = typeof logger;

async function ingestTransactionBatch(
  terminalId: string,
  rawPayload: string
): Promise<void> {
  const log = logger.child({ terminalId });
  log.info({ payloadLength: rawPayload.length }, "ingestion.batch_received");

  const { valid, invalid } = parseTransactionBatch(rawPayload, terminalId);

  if (invalid.length > 0) {
    log.warn({ invalidRows: invalid }, "ingestion.invalid_rows_skipped");
  }

  if (valid.length === 0) {
    log.warn("ingestion.no_valid_rows");
    return;
  }

  for (const tx of valid) {
    await processTransaction(tx, terminalId, log);
  }

  log.info({ processedCount: valid.length }, "ingestion.batch_complete");
}

async function processTransaction(
  tx: ParsedTransaction,
  terminalId: string,
  log: LoggerInstance
): Promise<void> {
  const txLog = log.child({
    transactionId: tx.transaction_id,
    studentUid: tx.student_uid,
  });

  try {
    // CHECK 1 — Is student whitelisted?
    const wallet = await prisma.wallet.findUnique({
      where: { student_uid: tx.student_uid },
      select: { balance: true, is_linked: true },
    });

    if (!wallet || !wallet.is_linked) {
      txLog.warn("ingestion.student_not_whitelisted");
      await publishToTerminal(
        terminalId,
        `ACK:FAIL,${tx.student_uid},NOT_WHITELISTED`
      );
      return;
    }

    // CHECK 2 — Is student blacklisted?
    const blacklisted = await prisma.blacklist.findUnique({
      where: { student_uid: tx.student_uid },
    });

    if (blacklisted) {
      txLog.warn("ingestion.student_is_blacklisted");
      await publishToTerminal(
        terminalId,
        `ACK:FAIL,${tx.student_uid},INSUFFICIENT_FUNDS`
      );
      return;
    }

    // CHECK 3 — Does student have enough balance?
    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < tx.amount) {
      txLog.warn(
        { currentBalance, required: tx.amount },
        "ingestion.insufficient_balance"
      );
      await publishToTerminal(
        terminalId,
        `ACK:FAIL,${tx.student_uid},INSUFFICIENT_FUNDS`
      );

      // Auto-blacklist if not already — balance is too low
      await prisma.blacklist.upsert({
        where: { student_uid: tx.student_uid },
        update: { blacklistedAt: new Date() },
        create: {
          student_uid: tx.student_uid,
          reason: "LOW_BALANCE",
        },
      });

      await broadcastDeltaToFleet(
        buildDeltaCommand("ADD", "BL", tx.student_uid)
      );
      return;
    }

    // Fetch active driver BEFORE transaction
    const terminal = await prisma.terminal.findUnique({
      where: { terminal_id: terminalId },
      select: { active_driver_uid: true },
    });

    const driverUid = tx.driver_uid || terminal?.active_driver_uid || null;

    // All checks passed — deduct atomically
    const result = await prisma.$transaction(
      async (tx_ctx: Prisma.TransactionClient) => {
        // Idempotency — skip if already processed
        const existingTx = await tx_ctx.transaction.findUnique({
          where: { transaction_id: tx.transaction_id },
        });

        if (existingTx) {
          txLog.debug("ingestion.duplicate_transaction_skipped");
          return { duplicate: true, newBalance: 0 };
        }

        // Record transaction
        await tx_ctx.transaction.create({
          data: {
            transaction_id: tx.transaction_id,
            type: "RIDE",
            terminal_id: tx.terminal_id,
            student_uid: tx.student_uid,
            amount: tx.amount,
            driver_uid: driverUid,
            synced_at: tx.synced_at,
          },
        });

        // Deduct fare
        const updatedWallet = await tx_ctx.wallet.update({
          where: { student_uid: tx.student_uid },
          data: { balance: { decrement: tx.amount } },
          select: { balance: true },
        });

        const newBalance = parseFloat(updatedWallet.balance.toString());

        txLog.info(
          { previousBalance: currentBalance, newBalance, driverUid },
          "ingestion.fare_deducted"
        );

        return { duplicate: false, newBalance };
      },
      { timeout: 15000 }
    );

    if (result.duplicate) return;

    const { newBalance } = result;

    // Send ACK to terminal
    await publishToTerminal(
      terminalId,
      `ACK:OK,${tx.student_uid},${newBalance.toFixed(2)}`
    );
    txLog.info({ newBalance }, "ingestion.ack_sent_to_terminal");

    // Post-deduction blacklist check
    if (isBelowThreshold(newBalance)) {
      const blacklistCmd = buildDeltaCommand("ADD", "BL", tx.student_uid);
      txLog.info(
        { newBalance },
        "ingestion.balance_now_below_threshold — blacklisting"
      );

      process.nextTick(async () => {
        try {
          await prisma.blacklist.upsert({
            where: { student_uid: tx.student_uid },
            update: { blacklistedAt: new Date() },
            create: {
              student_uid: tx.student_uid,
              reason: "LOW_BALANCE",
            },
          });
          await broadcastDeltaToFleet(blacklistCmd);
          txLog.info({ blacklistCmd }, "ingestion.blacklist_broadcast_sent");
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          txLog.error(
            { err: errMsg },
            "ingestion.post_deduction_blacklist_failed"
          );
        }
      });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    txLog.error({ err: errMsg }, "ingestion.transaction_processing_error");
    try {
      await publishToTerminal(
        terminalId,
        `ACK:FAIL,${tx.student_uid},SERVER_ERROR`
      );
    } catch (ackErr) {
      const ackErrMsg =
        ackErr instanceof Error ? ackErr.message : "Unknown error";
      txLog.error({ err: ackErrMsg }, "ingestion.ack_send_failed");
    }
  }
}

export { ingestTransactionBatch };
