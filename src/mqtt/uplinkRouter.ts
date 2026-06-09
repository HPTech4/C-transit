import {
  PAYLOAD_TYPE,
  detectPayloadType,
  parsePendingLink,
  parseDriverRegister,
  parseDriverEvent,
} from "../utils/parser.ts";
import { ingestTransactionBatch } from "../services/ingestion.service.ts";
import { handlePendingLink } from "../services/registration.service.ts";
import { handleLwtEvent } from "./lwtHandler.ts";
import logger from "../config/logger.ts";
import type { Logger } from "pino";
import { prisma } from "../services/ledger.service.ts";
import { publishToTerminal } from "./downlinkQueue.ts";
import {
  handleDriverRegister,
  handleDriverLogin,
  handleDriverLogout,
} from "../services/driver.service.ts";

// Type definition matching your pino child log structure
type ChildLogger = Logger;

function extractTerminalId(topic: string): string | null {
  const parts = topic.split("/");
  if (parts.length !== 3 || parts[0] !== "ctransit") return null;

  const id = parts[1].toUpperCase();

  // Very Important: Prevent the server from treating itself as a terminal
  if (id === "SERVER") return null;

  return id;
}

async function routeUplinkMessage(
  topic: string,
  payloadBuffer: Buffer
): Promise<void> {
  const terminalId = extractTerminalId(topic);
  if (!terminalId) {
    logger.warn({ topic }, "uplink.unrecognised_topic_format — discarding");
    return;
  }

  const log = logger.child({ terminalId, topic });
  const rawPayload = payloadBuffer.toString("utf8").trim();

  if (topic.endsWith("/status")) {
    await handleLwtEvent(terminalId, rawPayload);
    return;
  }
  if (!topic.endsWith("/tx")) {
    log.warn("uplink.unexpected_topic_suffix — discarding");
    return;
  }

  const payloadType = detectPayloadType(rawPayload);
  log.debug(
    { payloadType, payloadLength: rawPayload.length },
    "uplink.message_received"
  );

  switch (payloadType) {
    case PAYLOAD_TYPE.TRANSACTION_BATCH:
      await ingestTransactionBatch(terminalId, rawPayload);
      break;

    case PAYLOAD_TYPE.PENDING_LINK: {
      const { data, error } = parsePendingLink(rawPayload);
      if (error) {
        log.warn({ error }, "uplink.pending_link_parse_error — discarding");
        return;
      }
      if (data) {
        await handlePendingLink(terminalId, data);
      }
      break;
    }
    case PAYLOAD_TYPE.SYS_FULL_SYNC:
      await handleFullSyncRequest(terminalId, log);
      break;

    case PAYLOAD_TYPE.DRIVER_EVENT: {
      const { data, error } = parseDriverEvent(rawPayload);
      if (error) {
        log.warn({ error }, "uplink.driver_event_parse_error — discarding");
        return;
      }
      if (data) {
        await handleDriverEvent(terminalId, data, log);
      }
      break;
    }
    case PAYLOAD_TYPE.DRIVER_REGISTER: {
      const { data, error } = parseDriverRegister(rawPayload);
      if (error) {
        log.warn({ error }, "uplink.driver_register_parse_error — discarding");
        return;
      }
      if (data) {
        await handleDriverRegisterEvent(terminalId, data, log);
      }
      break;
    }
    default:
      log.warn(
        { rawPayload: rawPayload.substring(0, 80) },
        "uplink.unknown_payload_type"
      );
      break;
  }
}

async function handleFullSyncRequest(
  terminalId: string,
  log: ChildLogger
): Promise<void> {
  log.info("uplink.full_sync_requested");

  const MAX_CHUNK_BYTES = 500;
  const SYNC_DELAY_MS = 2000;
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // Fetch whitelist — all linked wallets
    const wallets = await prisma.wallet.findMany({
      where: { is_linked: true },
      select: { student_uid: true },
    });

    // Fetch blacklist — all blacklisted wallets
    const blacklisted = await prisma.blacklist.findMany({
      select: { student_uid: true },
    });

    const whitelistUids = wallets.map((w) => w.student_uid);
    const blacklistUids = blacklisted.map((b) => b.student_uid);

    log.info(
      {
        whitelistCount: whitelistUids.length,
        blacklistCount: blacklistUids.length,
      },
      "uplink.full_sync_data_fetched"
    );

    // Publish Whitelist
    if (whitelistUids.length === 0) {
      await publishToTerminal(terminalId, "SYS:WL,EMPTY");
    } else {
      const wlChunks = buildChunks("SYS:WL,", whitelistUids, MAX_CHUNK_BYTES);
      for (let i = 0; i < wlChunks.length; i++) {
        await publishToTerminal(terminalId, wlChunks[i]);
        log.debug(
          { chunk: i + 1, total: wlChunks.length },
          "uplink.wl_chunk_sent"
        );
        if (i < wlChunks.length - 1) await sleep(SYNC_DELAY_MS);
      }
    }

    await sleep(SYNC_DELAY_MS);

    // Publish Blacklist
    if (blacklistUids.length === 0) {
      await publishToTerminal(terminalId, "SYS:BL,EMPTY");
    } else {
      const blChunks = buildChunks("SYS:BL,", blacklistUids, MAX_CHUNK_BYTES);
      for (let i = 0; i < blChunks.length; i++) {
        await publishToTerminal(terminalId, blChunks[i]);
        log.debug(
          { chunk: i + 1, total: blChunks.length },
          "uplink.bl_chunk_sent"
        );
        if (i < blChunks.length - 1) await sleep(SYNC_DELAY_MS);
      }
    }

    await sleep(SYNC_DELAY_MS);

    await publishToTerminal(terminalId, "SYS:SYNC_COMPLETE");
    log.info("uplink.full_sync_complete");
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    log.error({ err: errMessage }, "uplink.full_sync_error");
    throw error;
  }
}

async function handleDriverEvent(
  terminalId: string,
  data: any,
  log: ChildLogger
): Promise<void> {
  const { action, driverUid } = data;

  if (action === "LOGIN") {
    const result = await handleDriverLogin(terminalId, driverUid);

    if (result.success) {
      await publishToTerminal(terminalId, `DRV:OK,${result.driverName}`);
      log.info({ driverUid }, "uplink.driver_login_success");
    } else {
      await publishToTerminal(terminalId, `DRV:FAIL,${result.message}`);
      log.warn({ driverUid }, "uplink.driver_login_failed");
    }
  } else if (action === "LOGOUT") {
    await handleDriverLogout(terminalId, driverUid);
    await publishToTerminal(terminalId, "DRV:BYE");
    log.info({ driverUid }, "uplink.driver_logout");
  }
}

async function handleDriverRegisterEvent(
  terminalId: string,
  data: any,
  log: ChildLogger
): Promise<void> {
  const result = await handleDriverRegister(terminalId, data);

  if (result.success) {
    await publishToTerminal(terminalId, `DRV:REG_OK,${data.matricNumber}`);
    log.info({ matricNumber: data.matricNumber }, "uplink.driver_registered");
  } else {
    await publishToTerminal(terminalId, `DRV:REG_FAIL,${result.message}`);
    log.warn(
      { matricNumber: data.matricNumber },
      "uplink.driver_register_failed"
    );
  }
}

function buildChunks(
  prefix: string,
  uids: string[],
  maxBytes: number
): string[] {
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = prefix.length;

  for (const uid of uids) {
    const segment = currentChunk.length === 0 ? uid : `|${uid}`;
    if (currentSize + segment.length > maxBytes) {
      chunks.push(`${prefix}${currentChunk.join("|")}`);
      currentChunk = [uid];
      currentSize = prefix.length + uid.length;
    } else {
      currentChunk.push(uid);
      currentSize += segment.length;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(`${prefix}${currentChunk.join("|")}`);
  }

  return chunks;
}

export { routeUplinkMessage };
