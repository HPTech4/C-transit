'use strict';

const { PAYLOAD_TYPE, detectPayloadType, parsePendingLink } = require('../utils/parser');
const { ingestTransactionBatch } = require('../services/ingestionService');
const { handlePendingLink } = require('../services/registrationService');
const { handleLwtEvent } = require('./lwtHandler');
const logger = require('../config/logger');
const { prisma } = require('../services/ledgerService');

// ============================================================
// UPLINK ROUTER — THE CENTRAL MESSAGE DISPATCHER
//
// Receives ALL messages from the broker and routes them
// based on topic and payload type.
//
// CRITICAL ARCHITECTURE NOTE:
// This function is awaited by `client.js` inside `customHandleAcks`.
// If this function resolves cleanly, the MQTT PUBACK is released.
// If it throws an error, the PUBACK is withheld and the hardware retries.
// ============================================================

/**
 * Extract the terminal ID from an MQTT topic.
 * Topic format: ctransit/[TERMINAL_ID]/tx or ctransit/[TERMINAL_ID]/status
 *
 * @param {string} topic
 * @returns {string|null}
 */
function extractTerminalId(topic) {
  const parts = topic.split('/');
  // Expected: ['ctransit', 'TERM_04', 'tx']
  if (parts.length !== 3 || parts[0] !== 'ctransit') return null;
  return parts[1].toUpperCase();
}

/**
 * Route an incoming MQTT message to the correct handler.
 * Async — client.js awaits this before releasing the PUBACK.
 *
 * @param {string} topic
 * @param {Buffer} payloadBuffer
 * @returns {Promise<void>}
 * @throws {Error} If processing fails in a way that should withhold PUBACK
 */
async function routeUplinkMessage(topic, payloadBuffer) {
  const terminalId = extractTerminalId(topic);

  if (!terminalId) {
    logger.warn({ topic }, 'uplink.unrecognised_topic_format — discarding');
    return;
  }

  const log = logger.child({ terminalId, topic });
  const rawPayload = payloadBuffer.toString('utf8').trim();

  // ── Status Topic (LWT) ────────────────────────────────
  if (topic.endsWith('/status')) {
    await handleLwtEvent(terminalId, rawPayload);
    return;
  }

  // ── Uplink Topic (tx) ─────────────────────────────────
  if (!topic.endsWith('/tx')) {
    log.warn('uplink.unexpected_topic_suffix — discarding');
    return;
  }

  const payloadType = detectPayloadType(rawPayload);
  log.debug({ payloadType, payloadLength: rawPayload.length }, 'uplink.message_received');

  switch (payloadType) {
    case PAYLOAD_TYPE.TRANSACTION_BATCH:
      // ── Normal tap batch from offline bus ────────────
      // This is the hot path. ingestTransactionBatch MUST complete
      // successfully before PUBACK is released by client.js.
      await ingestTransactionBatch(terminalId, rawPayload);
      break;

    case PAYLOAD_TYPE.PENDING_LINK: {
      // ── New card registration request ────────────────
      const { data, error } = parsePendingLink(rawPayload);
      if (error) {
        log.warn({ error }, 'uplink.pending_link_parse_error — discarding');
        // Still return cleanly — PUBACK released to clear hardware buffer
        return;
      }
      await handlePendingLink(terminalId, data);
      break;
    }

    case PAYLOAD_TYPE.SYS_FULL_SYNC:
      // ── Cold start: terminal lost its LittleFS files ──
      await handleFullSyncRequest(terminalId, log);
      break;

    default:
      log.warn({ rawPayload: rawPayload.substring(0, 80) }, 'uplink.unknown_payload_type');
      // Unknown payload — release PUBACK to prevent hardware from retrying endlessly
      break;
  }
}

// ── Hardened Full Sync Handler ─────────────────────────────────────

/**
 * Handle SYS:REQ_FULL_SYNC from a terminal with blank/wiped memory.
 * Queries PSQL whitelist and sends paginated chunks to the terminal's rx topic.
 * Max 500 bytes per MQTT publish to respect SIM800L serial buffer.
 *
 * @param {string} terminalId
 * @param {Object} log - Pino child logger
 */
async function handleFullSyncRequest(terminalId, log) {
  log.info('uplink.full_sync_requested');

  const { publishToTerminal } = require('./downlinkQueue');
  const MAX_CHUNK_BYTES = 500;
  // Delay between chunks to prevent SIM800L serial buffer overflow
  const SYNC_DELAY_MS = 2000; 

  // Helper to sleep without blocking Node's main thread
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    const wallets = await prisma.wallet.findMany({
      where: { is_linked: true },
      select: { student_uid: true },
    });

    const uids = wallets.map((w) => w.student_uid);

    if (uids.length === 0) {
      await publishToTerminal(terminalId, 'SYS:SYNC_COMPLETE');
      log.info('uplink.full_sync_complete_empty_whitelist');
      return;
    }

    const prefix = 'SYS:WL,';
    const chunks = [];
    let currentChunk = [];
    let currentSize = prefix.length;

    for (const uid of uids) {
      const segment = currentChunk.length === 0 ? uid : `|${uid}`;
      if (currentSize + segment.length > MAX_CHUNK_BYTES) {
        chunks.push(`${prefix}${currentChunk.join('|')}`);
        currentChunk = [uid];
        currentSize = prefix.length + uid.length;
      } else {
        currentChunk.push(uid);
        currentSize += segment.length;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(`${prefix}${currentChunk.join('|')}`);
    }

    log.info({ chunkCount: chunks.length, uidCount: uids.length }, 'uplink.full_sync_sending_chunks');

    // Send chunks with a deliberate pause to allow hardware write cycles
    for (let i = 0; i < chunks.length; i++) {
      await publishToTerminal(terminalId, chunks[i]);
      log.debug({ chunkIndex: i + 1, size: chunks[i].length }, 'uplink.full_sync_chunk_sent');
      
      // Pause after every chunk except the very last one
      if (i < chunks.length - 1) {
        await sleep(SYNC_DELAY_MS);
      }
    }

    // Final pause before sending the complete flag
    await sleep(SYNC_DELAY_MS);
    await publishToTerminal(terminalId, 'SYS:SYNC_COMPLETE');
    log.info('uplink.full_sync_complete');

  } catch (err) {
    log.error({ err: err.message }, 'uplink.full_sync_error');
    throw err; 
  }
}

module.exports = { routeUplinkMessage };
