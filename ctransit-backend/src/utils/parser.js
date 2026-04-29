'use strict';

const logger = require('../config/logger');

// ============================================================
// RAW CSV PAYLOAD PARSER
// The ESP32 sends lightweight raw text — never JSON.
// This module handles all payload interpretation.
//
// Uplink transaction format (one per line):
//   [Transaction_ID],[UID],[Amount],[Timestamp],[DriverUID]
//   e.g.: T04-1708000500-A1B2C3D4,A1B2C3D4,150,1708000500,Z9Y8X7W6
//
// Registration format (single line):
//   PENDING_LINK:[UID],[6_DIGIT_OTP],[AGENT_UID]
//
// System command format:
//   SYS:REQ_FULL_SYNC
// ============================================================

// ── Payload Type Detection ────────────────────────────────

const PAYLOAD_TYPE = {
  TRANSACTION_BATCH: 'TRANSACTION_BATCH',
  PENDING_LINK: 'PENDING_LINK',
  SYS_FULL_SYNC: 'SYS_FULL_SYNC',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Detect the type of raw payload from an ESP32 terminal.
 * @param {string} raw - Raw string payload from MQTT message
 * @returns {string} One of PAYLOAD_TYPE values
 */
function detectPayloadType(raw) {
  const trimmed = raw.trim();

  // 1. Known explicit commands
  if (trimmed.startsWith('PENDING_LINK:')) return PAYLOAD_TYPE.PENDING_LINK;
  if (trimmed === 'SYS:REQ_FULL_SYNC') return PAYLOAD_TYPE.SYS_FULL_SYNC;

  // 2. THE CATCH-ALL: Trap unsupported hardware telemetry or acknowledgments
  // If it starts with a standard command prefix but wasn't caught above, it's unknown.
  if (trimmed.startsWith('SYS:') || trimmed.startsWith('ACK:') || trimmed.startsWith('ERR:')) {
    return PAYLOAD_TYPE.UNKNOWN;
  }

  // 3. Default routing
  // Because transaction batches are raw CSV strings with no prefix, 
  // anything that survives the traps above is safely assumed to be a batch.
  return PAYLOAD_TYPE.TRANSACTION_BATCH;
}

// ── Transaction Batch Parser ──────────────────────────────

/**
 * Parse a raw CSV transaction batch from the hardware.
 * Splits by newline, parses each line, skips invalid rows.
 *
 * @param {string} raw - Full raw MQTT payload string
 * @param {string} terminalId - Terminal that sent this payload (for logging)
 * @returns {{ valid: Array, invalid: Array }}
 */
function parseTransactionBatch(raw, terminalId) {
  const lines = raw
    .split('\n')
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

/**
 * Parse a single CSV transaction line.
 * Format: [Transaction_ID],[UID],[Amount],[Timestamp],[DriverUID]
 *
 * @param {string} line
 * @param {string} terminalId
 * @returns {{ data?: Object, error?: string }}
 */
function parseSingleTransaction(line, terminalId) {
  const parts = line.split(',');

  if (parts.length !== 5) {
    return { error: `Expected 5 CSV fields, got ${parts.length}` };
  }

  const [transaction_id, student_uid, amountRaw, timestampRaw, driver_uid] = parts.map((p) =>
    p.trim()
  );

  // Validate transaction_id
  if (!transaction_id || transaction_id.length === 0) {
    return { error: 'transaction_id is empty' };
  }

// CRITICAL FIX: The ESP32 sends negative numbers for taps (e.g., -150).
  const parsedAmount = parseFloat(amountRaw);
  if (isNaN(parsedAmount) || parsedAmount === 0) {
    return { error: `Invalid amount: "${amountRaw}"` };
  }
  const amount = Math.abs(parsedAmount);

  // Validate and cast timestamp (Unix epoch seconds from ESP32's RTC)
  const epochSeconds = parseInt(timestampRaw, 10);
  if (isNaN(epochSeconds) || epochSeconds <= 0) {
    return { error: `Invalid timestamp: "${timestampRaw}"` };
  }
  const synced_at = new Date(epochSeconds * 1000);

  // Validate UIDs
  if (!student_uid || student_uid.length === 0) {
    return { error: 'student_uid is empty' };
  }

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

// ── Registration Parser ───────────────────────────────────

/**
 * Parse a PENDING_LINK registration payload.
 * Format: PENDING_LINK:[UID],[6_DIGIT_OTP],[AGENT_UID]
 *
 * @param {string} raw
 * @returns {{ data?: Object, error?: string }}
 */
function parsePendingLink(raw) {
  // Strip prefix
  const body = raw.replace('PENDING_LINK:', '').trim();
  const parts = body.split(',');

  if (parts.length !== 3) {
    return { error: `PENDING_LINK expects 3 fields after prefix, got ${parts.length}` };
  }

  const [uid, otp, agent_uid] = parts.map((p) => p.trim());

  if (!uid || uid.length === 0) return { error: 'UID is empty in PENDING_LINK' };
  if (!otp || !/^\d{6}$/.test(otp)) return { error: `OTP must be 6 digits, got "${otp}"` };
  if (!agent_uid || agent_uid.length === 0) return { error: 'agent_uid is empty in PENDING_LINK' };

  return { data: { uid, otp, agent_uid } };
}

// ── Delta Command Builder ─────────────────────────────────

/**
 * Build a standardised Delta command string for the hardware.
 * Format: [ACTION]:[TARGET_FILE],[UID]
 *
 * @param {'ADD'|'REM'} action
 * @param {'WL'|'BL'|'DRV'} target
 * @param {string} uid
 * @param {string|null} extra  - Optional extra data (e.g., PIN for DRV)
 * @returns {string}
 */
function buildDeltaCommand(action, target, uid, extra = null) {
  const base = `${action}:${target},${uid}`;
  return extra ? `${base},${extra}` : base;
}

module.exports = {
  PAYLOAD_TYPE,
  detectPayloadType,
  parseTransactionBatch,
  parsePendingLink,
  buildDeltaCommand,
};
