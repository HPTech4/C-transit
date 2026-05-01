"use strict";
import Redis from "ioredis";
import env from "./env.js";
import logger from "./logger.js";
let redisClient = null;
function getRedisClient() {
  if (redisClient) return redisClient;
  redisClient = new Redis(env.redis.url, {
    db: 0,
    retryStrategy(times) {
      if (times > 10) {
        logger.error({ times }, "redis.max_retries_exceeded — stopping");
        return null;
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn({ times, delayMs: delay }, "redis.reconnecting");
      return delay;
    },
    enableOfflineQueue: true,
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });
  redisClient.on("connect", () => logger.info("redis.connected"));
  redisClient.on("ready", () => logger.info("redis.ready"));
  redisClient.on("error", (err) =>
    logger.error({ err: err.message }, "redis.error")
  );
  redisClient.on("close", () => logger.warn("redis.connection_closed"));
  return redisClient;
}
const redisKeys = {
  linkOtp: (otp) => `link_otp:${otp}`,
  terminalQueue: (terminalId) => `queue:${terminalId.toLowerCase()}`,
};
const OTP_TTL_SECONDS = 300;
export { getRedisClient, redisKeys, OTP_TTL_SECONDS };
