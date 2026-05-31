"use strict";

import { prisma, isBelowThreshold } from "./ledger.service.js";
import logger from "../config/logger.js";
import { parseTransactionBatch, buildDeltaCommand } from "../utils/parser.js";
import { broadcastDeltaToFleet } from "./sync.service.js";
import { publishToTerminal } from "../mqtt/downlinkQueue.js";

async function ingestTransactionBatch(terminalId, rawPayload) {
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

async function processTransaction(tx, terminalId, log) {
  const txLog = log.child({
    transactionId: tx.transaction_id,
    studentUid: tx.student_uid,
  });

  try {
    const terminal = await prisma.terminal.findUnique({
      where: { terminal_id: terminalId },
      select: { active_driver_uid: true },
    });

    const driverUid = tx.driver_uid || terminal?.active_driver_uid || null;
    const result = await prisma.$transaction(
      async (tx_ctx) => {
        // ── Idempotency check
        const existingTx = await tx_ctx.transaction.findUnique({
          where: { transaction_id: tx.transaction_id },
        });

        if (existingTx) {
          txLog.debug("ingestion.duplicate_transaction_skipped");
          return { duplicate: true };
        }

        const wallet = await tx_ctx.wallet.findUnique({
          where: { student_uid: tx.student_uid },
          select: { balance: true },
        });

        if (!wallet) {
          txLog.warn("ingestion.wallet_not_found");
          return { walletFound: false };
        }

        //  Record transaction 
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

        txLog.info(
          { amount: tx.amount, driverUid },
          "ingestion.transaction_inserted"
        );

        const updatedWallet = await tx_ctx.wallet.update({
          where: { student_uid: tx.student_uid },
          data: { balance: { decrement: tx.amount } },
          select: { balance: true },
        });

        const previousBalance = parseFloat(wallet.balance);
        const newBalance = parseFloat(updatedWallet.balance);

        txLog.info({ previousBalance, newBalance }, "ingestion.fare_deducted");

        return { walletFound: true, newBalance, previousBalance };
      },
      {
        timeout: 15000,
      }
    );

    if (result.duplicate) return;

    if (!result.walletFound) {
      await publishToTerminal(
        terminalId,
        `ACK:FAIL,${tx.student_uid},WALLET_NOT_FOUND`
      );
      return;
    }

    const { newBalance } = result;

    // Send ACK to terminal — includes new balance for display
    await publishToTerminal(
      terminalId,
      `ACK:OK,${tx.student_uid},${newBalance.toFixed(2)}`
    );
    txLog.info({ newBalance }, "ingestion.ack_sent_to_terminal");

    // Blacklist if balance below threshold
    if (isBelowThreshold(newBalance)) {
      const blacklistCmd = buildDeltaCommand("ADD", "BL", tx.student_uid);
      txLog.info(
        { newBalance, blacklistCmd },
        "ingestion.threshold_breached — blacklisting"
      );

      // Add to blacklist table
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
        } catch (err) {
          txLog.error({ err: err.message }, "ingestion.blacklist_failed");
        }
      });
    }
  } catch (err) {
    txLog.error({ err: err.message }, "ingestion.transaction_processing_error");

    // Send NACK to terminal
    try {
      await publishToTerminal(
        terminalId,
        `ACK:FAIL,${tx.student_uid},SERVER_ERROR`
      );
    } catch (ackErr) {
      txLog.error({ err: ackErr.message }, "ingestion.ack_send_failed");
    }
  }
}

export { ingestTransactionBatch };
