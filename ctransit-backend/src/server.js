'use strict';

// Load and validate environment variables first — before any other import
require('./config/env');

const http = require('http');
const app = require('./app');
const { connectMqtt, disconnectMqtt } = require('./mqtt/client');
const { getRedisClient } = require('./config/redis');
const { prisma } = require('./services/ledgerService');
const logger = require('./config/logger');
const env = require('./config/env');

// ============================================================
// SERVER ENTRY POINT
// Boot sequence:
//   1. Connect to Redis
//   2. Connect to PostgreSQL (via Prisma)
//   3. Establish MQTTS connection to HiveMQ
//   4. Start HTTP server
//
// Shutdown sequence (SIGTERM/SIGINT):
//   1. Stop accepting new HTTP connections
//   2. Send MQTT DISCONNECT to broker (clean LWT)
//   3. Disconnect Redis
//   4. Disconnect Prisma (PostgreSQL connection pool)
// ============================================================

const server = http.createServer(app);
let isShuttingDown = false;

async function boot() {
  logger.info({ version: process.version, env: env.NODE_ENV }, 'server.boot_start');

  // ── 1. Redis ───────────────────────────────────────────
  try {
    const redis = getRedisClient();
    await redis.ping();
    logger.info('server.redis_ready');
  } catch (err) {
    logger.fatal({ err: err.message }, 'server.redis_connection_failed — aborting');
    process.exit(1);
  }

  // ── 2. PostgreSQL ──────────────────────────────────────
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('server.postgres_ready');
  } catch (err) {
    logger.fatal({ err: err.message }, 'server.postgres_connection_failed — aborting');
    process.exit(1);
  }

  // ── 3. MQTT ────────────────────────────────────────────
  try {
    await connectMqtt();
    logger.info('server.mqtt_ready');
  } catch (err) {
    logger.fatal({ err: err.message }, 'server.mqtt_connection_failed — aborting');
    process.exit(1);
  }

  // ── 4. HTTP Server ─────────────────────────────────────
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'server.http_listening');
  });

  server.on('error', (err) => {
    logger.fatal({ err: err.message }, 'server.http_error');
    process.exit(1);
  });

  logger.info('server.boot_complete — all systems operational');
}

// ── Graceful Shutdown ─────────────────────────────────────

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'server.shutdown_initiated');

  // Stop accepting new HTTP connections
  server.close(async () => {
    logger.info('server.http_closed');
  });

  try {
    await disconnectMqtt();
    logger.info('server.mqtt_disconnected');
  } catch (err) {
    logger.error({ err: err.message }, 'server.mqtt_disconnect_error');
  }

  try {
    const redis = getRedisClient();
    await redis.quit();
    logger.info('server.redis_disconnected');
  } catch (err) {
    logger.error({ err: err.message }, 'server.redis_disconnect_error');
  }

  try {
    await prisma.$disconnect();
    logger.info('server.postgres_disconnected');
  } catch (err) {
    logger.error({ err: err.message }, 'server.postgres_disconnect_error');
  }

  logger.info('server.shutdown_complete');
  process.exit(0);
}

// ── Process Signal Handlers ───────────────────────────────

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/K8s stop
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C in dev

// ── Unhandled Rejection & Exception Guards ────────────────
// These MUST NOT crash the server — the MQTT listener loop
// must stay alive to withhold PUBACKs if processing fails.

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { reason: String(reason), promise: String(promise) },
    'server.unhandled_promise_rejection — NOT crashing'
  );
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'server.uncaught_exception — shutting down safely');
  // Uncaught exceptions ARE fatal — shutdown gracefully
  shutdown('uncaughtException');
});

// ── Boot ──────────────────────────────────────────────────
boot();
