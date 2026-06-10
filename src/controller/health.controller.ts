import { Router, type Request, type Response } from "express";
import { getRedisClient } from "../config/redis.js";
import { prisma } from "../services/ledger.service.js";
import logger from "../config/logger.js";

const router = Router();

type CheckStatus = "UNKNOWN" | "OK" | "FAIL";

interface HealthChecks {
  postgres: CheckStatus;
  redis: CheckStatus;
}

router.get("/", async (req: Request, res: Response) => {
  const checks: HealthChecks = {
    postgres: "UNKNOWN",
    redis: "UNKNOWN",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = "OK";
  } catch (error) {
    checks.postgres = "FAIL";
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: errMessage }, "health.postgres_check_failed");
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = "OK";
  } catch (error) {
    checks.redis = "FAIL";
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: errMessage }, "health.redis_check_failed");
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
