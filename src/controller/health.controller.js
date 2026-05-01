"use strict";
import express from "express";
import { getRedisClient } from "../config/redis.js";
import { prisma } from "../services/ledger.service.js";
import logger from "../config/logger.js";
const router = express.Router();
router.get("/", async (req, res) => {
  const checks = {
    postgres: "UNKNOWN",
    redis: "UNKNOWN",
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = "OK";
  } catch (err) {
    checks.postgres = "FAIL";
    logger.error({ err: err.message }, "health.postgres_check_failed");
  }
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = "OK";
  } catch (err) {
    checks.redis = "FAIL";
    logger.error({ err: err.message }, "health.redis_check_failed");
  }
  const allHealthy = Object.values(checks).every((v) => v === "OK");
  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
});
export default router;
