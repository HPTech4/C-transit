'use strict';

import { prisma } from '../services/ledgerService.js';
import { flushTerminalQueue } from '../services/syncService.js';
import logger from '../config/logger.js';

// ============================================================
// LWT HANDLER — LAST WILL & TESTAMENT PROCESSOR
//
// HiveMQ detects broken TCP connections and auto-publishes
// "OFFLINE" to ctransit/[TERMINAL_ID]/status.
//
// This module:
//   - Updates terminal status in PSQL terminals table
//   - On ONLINE: flushes queued Redis downlink messages
//   - On OFFLINE: locks the record and logs disconnection time
// ============================================================

/**
 * Process a status event from the ctransit/+/status topic.
 *
 * @param {string} terminalId - Extracted from topic wildcard
 * @param {string} statusPayload - 'ONLINE' or 'OFFLINE'
 */
async function handleLwtEvent(terminalId, statusPayload) {
  const status = statusPayload.trim().toUpperCase();
  const log = logger.child({ terminalId, status });

  if (status !== 'ONLINE' && status !== 'OFFLINE') {
    log.warn({ rawPayload: statusPayload }, 'lwt.unknown_status_payload — ignoring');
    return;
  }

  try {
    // Update PSQL terminal record with new status and last_seen timestamp
    await prisma.terminal.upsert({
      where: { terminal_id: terminalId },
      update: {
        status,
        last_seen: new Date(),
      },
      create: {
        // Terminal published a status but has no DB record yet.
        // Create a minimal placeholder — admin must provision the secret_key.
        terminal_id: terminalId,
        status,
        last_seen: new Date(),
        secret_key: 'UNPROVISIONED', // Admin must update via dashboard
      },
    });

    log.info('lwt.terminal_status_updated');

    // ── Wake-Up Flush ──────────────────────────────────────
    // The moment a terminal comes ONLINE, drain its Redis backlog.
    // This is the critical "missed messages" delivery mechanism.
    if (status === 'ONLINE') {
      log.info('lwt.terminal_online — flushing redis queue');
      // Non-blocking: flush runs async, does not delay LWT acknowledgement
      flushTerminalQueue(terminalId).catch((err) => {
        log.error({ err: err.message }, 'lwt.queue_flush_error');
      });
    } else {
      log.info('lwt.terminal_offline — status locked in db');
    }
  } catch (err) {
    log.error({ err: err.message }, 'lwt.db_update_error');
    // Do not re-throw — LWT processing failure must not crash the MQTT listener
  }
}

export { handleLwtEvent };
