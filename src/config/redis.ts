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
        return null;
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

  (redisClient as IORedisPkg.Redis).on("connect", () =>
    logger.info("redis.connected")
  );
  (redisClient as IORedisPkg.Redis).on("ready", () =>
    logger.info("redis.ready")
  );
  (redisClient as IORedisPkg.Redis).on("error", (err: Error) =>
    logger.error({ err: err.message }, "redis.error")
  );
  (redisClient as IORedisPkg.Redis).on("close", () =>
    logger.warn("redis.connection_closed")
  );

  return redisClient;
}

// ── MQTT & OTP Keys ───────────────────────────────────────────────────────────
// Used for terminal downlink queues and card registration OTP flow
const redisKeys = {
  // Card registration OTP: SETEX link_otp:{otp} 300 "cardUid|terminalId"
  linkOtp: (otp: string | number): string => `link_otp:${otp}`,

  // Per-terminal downlink queue: RPUSH queue:term_01 "ADD:WL,uid"
  terminalQueue: (terminalId: string): string =>
    `queue:${terminalId.toLowerCase()}`,
};

// ── Hot Read Cache Keys ───────────────────────────────────────────────────────
// These cache the 3 DB reads that fire on EVERY terminal tap.
// Keeping them separate from redisKeys makes their purpose explicit.
const cacheKeys = {
  // Maps hardware card UID → student matricNumber
  // No TTL — permanent mapping, invalidated only on card re-link
  // e.g. card:map:238DB4E8 → "2022/1/87453LH"
  cardMap: (cardUid: string): string => `card:map:${cardUid}`,

  // Caches wallet { balance, is_linked } per student
  // Short TTL — balance changes on every tap
  // e.g. wallet:2022/1/87453LH → '{"balance":1350,"is_linked":true}'
  wallet: (matricNumber: string): string => `wallet:${matricNumber}`,

  // Caches blacklist presence per student
  // Longer TTL — changes less frequently than balance
  // e.g. blacklist:2022/1/87453LH → "1" (blacklisted) | "0" (clean)
  blacklist: (matricNumber: string): string => `blacklist:${matricNumber}`,

  // Caches agent account status for middleware checks on every agent request
  // Value is the raw AgentStatus string: "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
  // MUST be DEL'd immediately when admin changes agent status — no grace window
  // e.g. agent:status:uuid → "ACTIVE"
  agentStatus: (agentId: string): string => `agent:status:${agentId}`,
};

// ── TTL Constants ─────────────────────────────────────────────────────────────
const OTP_TTL_SECONDS = 300; // Card registration OTP — 5 minutes

// Wallet balance TTL: short because balance changes on every tap.
// A stale read here means a student could be served an incorrect balance display
// on the terminal screen — acceptable for 30s, not longer.
const WALLET_CACHE_TTL = 30; // seconds

// Blacklist status TTL: longer than wallet because it changes less frequently.
// A stale read here means a blacklisted student could get one free ride — acceptable
// for 60s during testing. Restore to 10s when payment API is live and balance matters.
const BLACKLIST_CACHE_TTL = 60; // seconds

// Agent status TTL: short enough that a suspension propagates within one minute.
// The agent service MUST DEL this key on every status change to invalidate immediately
// rather than waiting for TTL expiry.
const AGENT_STATUS_TTL = 60; // seconds

export {
  getRedisClient,
  redisKeys,
  cacheKeys,
  OTP_TTL_SECONDS,
  WALLET_CACHE_TTL,
  BLACKLIST_CACHE_TTL,
  AGENT_STATUS_TTL,
};
