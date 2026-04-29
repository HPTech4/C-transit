'use strict';

const express = require('express');
const { getRedisClient } = require('../config/redis');
const { prisma } = require('../services/ledgerService');
const logger = require('../config/logger');

const router = express.Router();

// ============================================================
// HEALTH CHECK ENDPOINT
// GET /health
// Returns the status of all critical dependencies.
// Used by load balancers, uptime monitors, and deploy pipelines.
// ============================================================

router.get('/', async (req, res) => {
  const checks = {
    postgres: 'UNKNOWN',
    redis: 'UNKNOWN',
  };

  // ── PostgreSQL ────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = 'OK';
  } catch (err) {
    checks.postgres = 'FAIL';
    logger.error({ err: err.message }, 'health.postgres_check_failed');
  }

  // ── Redis ─────────────────────────────────────────────
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = 'OK';
  } catch (err) {
    checks.redis = 'FAIL';
    logger.error({ err: err.message }, 'health.redis_check_failed');
  }

  const allHealthy = Object.values(checks).every((v) => v === 'OK');
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

module.exports = router;
