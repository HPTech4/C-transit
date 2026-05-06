'use strict';
import { PAYLOAD_TYPE, detectPayloadType, parsePendingLink, buildDeltaCommand } from '../utils/parser.js';
import { ingestTransactionBatch } from '../services/ingestion.service.js';
import { handlePendingLink } from '../services/registration.service.js';
import { handleLwtEvent } from './lwtHandler.js';
import logger from '../config/logger.js';
import { prisma } from '../services/ledger.service.js';
import { broadcastDeltaToFleet } from '../services/sync.service.js';
import { publishToTerminal } from './downlinkQueue.js';

function extractTerminalId(topic) {
  const parts = topic.split("/");
  if (parts.length !== 3 || parts[0] !== "ctransit") return null;

  const id = parts[1].toUpperCase();

  // RUTHLESS FIX: Prevent the server from treating itself as a terminal
  if (id === "SERVER") return null;

  return id;
}

async function routeUplinkMessage(topic, payloadBuffer) {
  const terminalId = extractTerminalId(topic);
  if (!terminalId) {
    logger.warn({ topic }, 'uplink.unrecognised_topic_format — discarding');
    return;
  }

  const log = logger.child({ terminalId, topic });
  const rawPayload = payloadBuffer.toString('utf8').trim();
  if (topic.endsWith('/status')) {
    await handleLwtEvent(terminalId, rawPayload);
    return;
  }
  if (!topic.endsWith('/tx')) {
    log.warn('uplink.unexpected_topic_suffix — discarding');
    return;
  }
  const payloadType = detectPayloadType(rawPayload);
  log.debug({ payloadType, payloadLength: rawPayload.length }, 'uplink.message_received');
  switch (payloadType) {
    case PAYLOAD_TYPE.TRANSACTION_BATCH:
      await ingestTransactionBatch(terminalId, rawPayload);
      break;
    case PAYLOAD_TYPE.PENDING_LINK: {
      const { data, error } = parsePendingLink(rawPayload);
      if (error) {
        log.warn({ error }, 'uplink.pending_link_parse_error — discarding');
        return;
      }
      await handlePendingLink(terminalId, data);
      break;
    }
    case PAYLOAD_TYPE.SYS_FULL_SYNC:
      await handleFullSyncRequest(terminalId, log);
      break;
    default:
      log.warn({ rawPayload: rawPayload.substring(0, 80) }, 'uplink.unknown_payload_type');
      break;
  }
}

async function handleFullSyncRequest(terminalId, log) {
  log.info('uplink.full_sync_requested');
  const MAX_CHUNK_BYTES = 500;
  const SYNC_DELAY_MS = 2000;
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
    for (let i = 0; i < chunks.length; i++) {
      await publishToTerminal(terminalId, chunks[i]);
      log.debug({ chunkIndex: i + 1, size: chunks[i].length }, 'uplink.full_sync_chunk_sent');
      if (i < chunks.length - 1) {
        await sleep(SYNC_DELAY_MS);
      }
    }
    await sleep(SYNC_DELAY_MS);
    await publishToTerminal(terminalId, 'SYS:SYNC_COMPLETE');
    log.info('uplink.full_sync_complete');
  } catch (err) {
    log.error({ err: err.message }, 'uplink.full_sync_error');
    throw err;
  }
}

export { routeUplinkMessage };
