import * as IORedisPkg from "ioredis";
import { type RedisOptions } from "ioredis";
import env from "./env.js";
import logger from "./logger.js";

const Redis = IORedisPkg.default;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRedisClient(): any {
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
  // @ts-expect-error - ioredis has complex module exports
  redisClient = new Redis(env.redis.url, options);

  (redisClient as IORedisPkg.Redis).on("connect", () => logger.info("redis.connected"));
  (redisClient as IORedisPkg.Redis).on("ready", () => logger.info("redis.ready"));
  (redisClient as IORedisPkg.Redis).on("error", (err: Error) =>
    logger.error({ err: err.message }, "redis.error")
  );
  (redisClient as IORedisPkg.Redis).on("close", () => logger.warn("redis.connection_closed"));

  return redisClient;
}

const redisKeys = {
  linkOtp: (otp: string | number): string => `link_otp:${otp}`,
  terminalQueue: (terminalId: string): string =>
    `queue:${terminalId.toLowerCase()}`,
};

const OTP_TTL_SECONDS = 300;

export { getRedisClient, redisKeys, OTP_TTL_SECONDS };
