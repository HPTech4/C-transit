'use strict';

import Redis from 'ioredis';
import env from './env.js';
import logger from './logger.js';

// ============================================================
// REDIS CLIENT — VOLATILE STATE MANAGEMENT
// Handles: Registration OTPs (5-min TTL) & Offline Terminal
// Downlink Queues. DO NOT use for ledger or permanent data.
// ============================================================

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    db: 0,

    // Reconnect strategy — critical for a long-running daemon
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000); // cap at 5s
      logger.warn({ times, delayMs: delay }, 'redis.reconnecting');
      return delay;
    },

    // Do not crash the process on connection failure —
    // queue commands and replay when reconnected
    enableOfflineQueue: true,
    maxRetriesPerRequest: null,

    lazyConnect: false,
  });

  redisClient.on('connect', () => {
    logger.info('redis.connected');
  });

  redisClient.on('ready', () => {
    logger.info('redis.ready');
  });

  redisClient.on('error', (err) => {
    logger.error({ err: err.message }, 'redis.error');
  });

  redisClient.on('close', () => {
    logger.warn('redis.connection_closed');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('redis.reconnecting');
  });

  return redisClient;
}

// ── Redis Key Factories ───────────────────────────────────
// Centralised key patterns — prevents typos across services.
const redisKeys = {
  // OTP registration: SETEX link_otp:[OTP] 300 "[UID]|[TERMINAL_ID]"
  linkOtp: (otp) => `link_otp:${otp}`,

  // Per-terminal downlink queue: RPUSH queue:term_04 "ADD:BL,UID"
  terminalQueue: (terminalId) => `queue:${terminalId.toLowerCase()}`,
};

// ── OTP TTL (seconds) ─────────────────────────────────────
const OTP_TTL_SECONDS = 300; // 5 minutes — strictly enforced

export { getRedisClient, redisKeys, OTP_TTL_SECONDS };
