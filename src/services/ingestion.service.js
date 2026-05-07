"use strict";

// ✅ Bug 2 Fixed — removed new PrismaClient(), using shared instance
import { prisma, deductFare, isBelowThreshold } from "./ledger.service.js";
import logger from "../config/logger.js";
import { parseTransactionBatch, buildDeltaCommand } from "../utils/parser.js";
import { broadcastDeltaToFleet } from "./sync.service.js";

async function ingestTransactionBatch(terminalId, rawPayload) {
  const log = logger.child({ terminalId });
  log.info({ payloadLength: rawPayload.length }, "ingestion.batch_received");

  const { valid, invalid } = parseTransactionBatch(rawPayload, terminalId);

  if (invalid.length > 0) {
    log.warn({ invalidRows: invalid }, "ingestion.invalid_rows_skipped");
  }

  if (valid.length === 0) {
    log.warn("ingestion.no_valid_rows — releasing PUBACK anyway");
    return;
  }

  log.info({ validCount: valid.length }, "ingestion.processing_valid_rows");

  for (const tx of valid) {
    await processTransaction(tx, log);
  }

  log.info({ processedCount: valid.length }, "ingestion.batch_complete");
}

async function processTransaction(tx, log) {
  const txLog = log.child({
    transactionId: tx.transaction_id,
    studentUid: tx.student_uid,
  });

  try {
    await prisma.$transaction(async (prismaTx) => {
      const existingTx = await prismaTx.transaction.findUnique({
        where: { transaction_id: tx.transaction_id },
      });

      if (existingTx) {
        txLog.debug("ingestion.duplicate_transaction_skipped");
        return;
      }

      await prismaTx.transaction.create({
        data: {
          transaction_id: tx.transaction_id,
          type: "RIDE",
          terminal_id: tx.terminal_id,
          student_uid: tx.student_uid,
          amount: tx.amount,
          driver_uid: tx.driver_uid,
          synced_at: tx.synced_at,
        },
      });

      txLog.info({ amount: tx.amount }, "ingestion.transaction_inserted");

      const { newBalance, walletFound } = await deductFare(
        tx.student_uid,
        tx.amount,
        tx.transaction_id,
        prismaTx // ✅ passes the transaction context correctly
      );

      if (!walletFound) {
        txLog.error(
          "ingestion.wallet_not_found — transaction recorded but no deduction"
        );
        return;
      }

      if (isBelowThreshold(newBalance)) {
        const blacklistCmd = buildDeltaCommand("ADD", "BL", tx.student_uid);
        txLog.info(
          { newBalance, blacklistCmd },
          "ingestion.threshold_breached — blacklisting"
        );
        process.nextTick(() =>
          broadcastDeltaToFleet(blacklistCmd).catch((err) =>
            txLog.error(
              { err: err.message },
              "ingestion.blacklist_broadcast_failed"
            )
          )
        );
      }
    });
  } catch (err) {
    txLog.error({ err: err.message }, "ingestion.transaction_processing_error");
  }
}

export { ingestTransactionBatch };
