'use strict';

// Load and validate environment variables first — before any other import
import './src/config/env.js';

import http from 'http';
import app from './app.js';
import { connectMqtt, disconnectMqtt } from './src/mqtt/client.js';
import { getRedisClient } from './src/config/redis.js';
import { prisma } from './src/services/ledger.service.js';
import logger from './src/config/logger.js';
import env from './src/config/env.js';

// HTTP server with boot/shutdown sequence for Redis, PostgreSQL, and MQTT

const server = http.createServer(app);
let isShuttingDown = false;

async function boot() {
  logger.info({ version: process.version, env: env.NODE_ENV }, 'server.boot_start');

  try {
    const redis = getRedisClient();
    await redis.ping();
    logger.info('server.redis_ready');
  } catch (err) {
    logger.fatal({ err: err.message }, 'server.redis_connection_failed — aborting');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('server.postgres_ready');
    console.log('✓ Database connection successful');
  } catch (err) {
    logger.fatal({ err: err.message }, 'server.postgres_connection_failed — aborting');
    process.exit(1);
  }

  try {
    await connectMqtt();
    logger.info('server.mqtt_ready');
  } catch (err) {
    logger.fatal({ err: err.message }, 'server.mqtt_connection_failed — aborting');
    process.exit(1);
  }

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'server.http_listening');
    console.log(`✓ Server successfully started on port ${env.PORT}`);
  });

  server.on('error', (err) => {
    logger.fatal({ err: err.message }, 'server.http_error');
    process.exit(1);
  });

  logger.info('server.boot_complete — all systems operational');
}

// Graceful shutdown handler

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'server.shutdown_initiated');

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

// ── Boot ─────────────────────────────────────────────────
boot();
