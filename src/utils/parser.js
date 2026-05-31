"use strict";

import logger from "../config/logger.js";

const PAYLOAD_TYPE = {
  TRANSACTION_BATCH: "TRANSACTION_BATCH",
  PENDING_LINK: "PENDING_LINK",
  SYS_FULL_SYNC: "SYS_FULL_SYNC",
  DRIVER_EVENT: "DRIVER_EVENT",
  UNKNOWN: "UNKNOWN",
};

function detectPayloadType(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("PENDING_LINK:")) return PAYLOAD_TYPE.PENDING_LINK;
  if (trimmed === "SYS:REQ_FULL_SYNC") return PAYLOAD_TYPE.SYS_FULL_SYNC;
   if (trimmed.startsWith("DRV:")) return PAYLOAD_TYPE.DRIVER_EVENT;
  if (
    trimmed.startsWith("SYS:") ||
    trimmed.startsWith("ACK:") ||
    trimmed.startsWith("ERR:") ||
    trimmed.startsWith("REG:")
  ) {
    return PAYLOAD_TYPE.UNKNOWN;
  }
  return PAYLOAD_TYPE.TRANSACTION_BATCH;
}

function parseDriverEvent(raw) {
  const body = raw.replace("DRV:", "").trim();
  const parts = body.split(",").map((p) => p.trim());

  if (parts.length !== 2) {
    return { error: `DRV event expects 2 fields, got ${parts.length}` };
  }

  const [action, driverUid] = parts;

  if (action !== "LOGIN" && action !== "LOGOUT") {
    return {
      error: `Unknown DRV action: "${action}". Expected LOGIN or LOGOUT`,
    };
  }

  if (!driverUid || driverUid.length === 0) {
    return { error: "driver_uid is empty" };
  }

  return { data: { action, driverUid } };
}

function parseTransactionBatch(raw, terminalId) {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const valid = [];
  const invalid = [];

  for (const line of lines) {
    const parsed = parseSingleTransaction(line, terminalId);
    if (parsed.error) {
      invalid.push({ line, reason: parsed.error });
    } else {
      valid.push(parsed.data);
    }
  }

  return { valid, invalid };
}

function parseSingleTransaction(line, terminalId) {
  let transaction_id, student_uid, amountRaw, timestampRaw, driver_uid;

  if (line.includes(":") && !line.startsWith("PENDING_LINK")) {
    const colonIdx = line.indexOf(":");
    const rest = line.slice(colonIdx + 1); 
    const parts = rest.split(",").map((p) => p.trim());

    if (parts.length < 3 || parts.length > 4) {
      return {
        error: `Format B expects 3-4 fields after colon, got ${parts.length}`,
      };
    }

    [student_uid, amountRaw, timestampRaw, driver_uid] = parts;

    const ts = parseInt(timestampRaw, 10);
    transaction_id = `${terminalId}-${ts}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
  } else {
    const parts = line.split(",").map((p) => p.trim());

    if (parts.length !== 5) {
      return { error: `Expected 5 CSV fields, got ${parts.length}` };
    }

    [transaction_id, student_uid, amountRaw, timestampRaw, driver_uid] = parts;
  }

  // Validate transaction_id
  if (!transaction_id || transaction_id.length === 0) {
    return { error: "transaction_id is empty" };
  }

  // Validate student_uid
  if (!student_uid || student_uid.length === 0) {
    return { error: "student_uid is empty" };
  }

  // Validate amount
  const parsedAmount = parseFloat(amountRaw);
  if (isNaN(parsedAmount) || parsedAmount === 0) {
    return { error: `Invalid amount: "${amountRaw}"` };
  }
  const amount = Math.abs(parsedAmount);

  // Validate timestamp
  const epochSeconds = parseInt(timestampRaw, 10);
  if (isNaN(epochSeconds) || epochSeconds <= 0) {
    return { error: `Invalid timestamp: "${timestampRaw}"` };
  }
  const synced_at = new Date(epochSeconds * 1000);

  return {
    data: {
      transaction_id,
      terminal_id: terminalId,
      student_uid,
      amount,
      driver_uid: driver_uid || null,
      synced_at,
    },
  };
}

function parsePendingLink(raw) {
  const body = raw.replace("PENDING_LINK:", "").trim();
  const parts = body.split(",");

  if (parts.length !== 3) {
    return {
      error: `PENDING_LINK expects 3 fields after prefix, got ${parts.length}`,
    };
  }

  const [uid, otp, agent_uid] = parts.map((p) => p.trim());

  if (!uid || uid.length === 0)
    return { error: "UID is empty in PENDING_LINK" };
  if (!otp || !/^\d{6}$/.test(otp))
    return { error: `OTP must be 6 digits, got "${otp}"` };
  if (!agent_uid || agent_uid.length === 0)
    return { error: "agent_uid is empty in PENDING_LINK" };

  return { data: { uid, otp, agent_uid } };
}

function buildDeltaCommand(action, target, uid, extra = null) {
  const base = `${action}:${target},${uid}`;
  return extra ? `${base},${extra}` : base;
}

export {
  PAYLOAD_TYPE,
  detectPayloadType,
  parseTransactionBatch,
  parsePendingLink,
  parseDriverEvent,
  buildDeltaCommand,
};