'use strict';

import { getRedisClient, redisKeys, OTP_TTL_SECONDS } from '../config/redis.js';
import { activateWallet, prisma } from './ledgerService.js';
import { buildDeltaCommand } from '../utils/parser.js';
import { routeDeltaToTerminal, broadcastDeltaToFleet } from './syncService.js';
import logger from '../config/logger.js';

// ============================================================
// REGISTRATION SERVICE — LIVE HARDWARE-TO-APP HANDSHAKE
//
// This is a DUAL-CHANNEL ASYNC handshake:
//   Channel 1: Hardware (ESP32) initiates via MQTT uplink
//   Channel 2: Mobile app finalises via REST API OTP submission
//
// The floating state lives EXCLUSIVELY in Redis.
// PSQL is NOT touched until OTP is confirmed.
//
// SAD §1.5 — 5-Minute TTL enforced strictly.
// ============================================================

/**
 * Handle a PENDING_LINK provisioning request from hardware.
 * Stores the OTP in Redis with a 300-second TTL.
 * DOES NOT write to PostgreSQL.
 *
 * @param {string} terminalId - Terminal that scanned the card
 * @param {{ uid: string, otp: string, agent_uid: string }} linkData
 */
async function handlePendingLink(terminalId, linkData) {
  const redis = getRedisClient();
  const log = logger.child({ terminalId, uid: linkData.uid, otp: linkData.otp });

  const key = redisKeys.linkOtp(linkData.otp);
  // Value format: "[UID]|[TERMINAL_ID]" — terminal needed for immediate ADD:WL on confirm
  const value = `${linkData.uid}|${terminalId}`;

  // SETEX: Set with expiry — Redis physically deletes after 300 seconds.
  // No extension, no renewal. Student must be fast.
  await redis.setex(key, OTP_TTL_SECONDS, value);

  log.info(
    { ttlSeconds: OTP_TTL_SECONDS, cacheKey: key },
    'registration.otp_cached — awaiting mobile app confirmation'
  );
}

/**
 * Confirm a registration via OTP submitted from the mobile app.
 * Called by the mobile API route (not from MQTT).
 *
 * Executes the "3-Step Close" per SAD §1.5.3:
 *   1. Retrieve UID from Redis (validates OTP & TTL).
 *   2. Permanently link in PSQL wallets table.
 *   3. Publish ADD:WL directly to the origin terminal (immediate boarding).
 *   4. Broadcast ADD:WL to all other terminals via Redis queues.
 *
 * @param {string} otp - 6-digit OTP from mobile app
 * @returns {Promise<{ success: boolean, message: string, uid?: string }>}
 */
async function confirmRegistration(otp) {
  const redis = getRedisClient();
  const log = logger.child({ otp });

  const key = redisKeys.linkOtp(otp);

  // ── Step 1: Redis OTP Lookup ──────────────────────────
  const cached = await redis.get(key);

  if (!cached) {
    // Redis returned null — OTP expired or never existed
    log.warn('registration.otp_not_found_or_expired');
    return {
      success: false,
      message: 'OTP has expired or is invalid. Agent must generate a new code.',
    };
  }

  const [uid, originTerminalId] = cached.split('|');

  if (!uid || !originTerminalId) {
    log.error({ cached }, 'registration.malformed_cache_value');
    return { success: false, message: 'Internal registration state corrupted.' };
  }

  log.info({ uid, originTerminalId }, 'registration.otp_confirmed');

  // ── Step 2: Permanent PSQL Link ───────────────────────
  try {
    await activateWallet(uid);
  } catch (err) {
    log.error({ err: err.message, uid }, 'registration.wallet_activation_failed');
    return { success: false, message: 'Database error during wallet activation.' };
  }

  // ── Step 3: Delete OTP from Redis (consumed) ──────────
  await redis.del(key);
  log.debug({ key }, 'registration.otp_consumed_from_redis');

  // ── Step 4: Immediate Sync to Origin Terminal ─────────
  const addWlCmd = buildDeltaCommand('ADD', 'WL', uid);

  try {
    // The student is STANDING at this terminal — publish directly regardless of queue
    // routeDeltaToTerminal handles online/offline routing internally
    await routeDeltaToTerminal(originTerminalId, addWlCmd);
    log.info({ originTerminalId, addWlCmd }, 'registration.origin_terminal_synced');
  } catch (err) {
    log.error({ err: err.message }, 'registration.origin_sync_failed');
    // Non-fatal: wallet is activated, student will sync on next terminal connection
  }

  // ── Step 5: Fleet Broadcast (excluding origin) ────────
  try {
    const allTerminals = await prisma.terminal.findMany({
      where: { terminal_id: { not: originTerminalId } },
      select: { terminal_id: true },
    });

    await Promise.allSettled(
      allTerminals.map((t) => routeDeltaToTerminal(t.terminal_id, addWlCmd))
    );

    log.info(
      { terminalCount: allTerminals.length, addWlCmd },
      'registration.fleet_sync_queued'
    );
  } catch (err) {
    log.error({ err: err.message }, 'registration.fleet_sync_error');
  }

  return { success: true, message: 'Card successfully linked and activated.', uid };
}

export { handlePendingLink, confirmRegistration };
