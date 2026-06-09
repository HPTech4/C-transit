import Redis, { type RedisOptions } from "ioredis";
import env from "./env.ts";
import logger from "./logger.ts";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const options: RedisOptions = {
    db: 0,
    retryStrategy(times: number): number | null {
      if (times > 10) {
        logger.error({ times }, "redis.max_retries_exceeded — stopping");
        return null; // Returning null tells ioredis to stop retrying
      }
      const delay = Math.min(times * 200, 5000);
      logger.warn({ times, delayMs: delay }, "redis.reconnecting");
      return delay;
    },
    enableOfflineQueue: true,
    maxRetriesPerRequest: null,
    lazyConnect: false,
  };

  redisClient = new Redis(env.redis.url, options);

  redisClient.on("connect", () => logger.info("redis.connected"));
  redisClient.on("ready", () => logger.info("redis.ready"));
  redisClient.on("error", (err: Error) =>
    logger.error({ err: err.message }, "redis.error")
  );
  redisClient.on("close", () => logger.warn("redis.connection_closed"));

  return redisClient;
}

const redisKeys = {
  linkOtp: (otp: string | number): string => `link_otp:${otp}`,
  terminalQueue: (terminalId: string): string =>
    `queue:${terminalId.toLowerCase()}`,
};

const OTP_TTL_SECONDS = 300;

export { getRedisClient, redisKeys, OTP_TTL_SECONDS };
