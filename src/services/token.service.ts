// src/services/token.service.ts
//
// Handles refresh token lifecycle: issue, verify, revoke.
// Access token signing stays in auth.controller.ts —
// this service only owns the refresh side.

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  getRedisClient,
  cacheKeys,
  REFRESH_TOKEN_TTL,
} from "../config/redis.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

export interface RefreshTokenPayload {
  userId: string;
  role: "ADMIN" | "AGENT" | "STUDENT" | "DRIVER";
  email: string;
}

// ─────────────────────────────────────────────
// issueRefreshToken
// Generates a UUID tokenId, signs it into a JWT,
// and stores the payload in Redis with a 7-day TTL.
// The JWT itself contains only the tokenId — the
// real payload lives in Redis so it can be revoked
// instantly without waiting for JWT expiry.
// ─────────────────────────────────────────────
export const issueRefreshToken = async (
  payload: RefreshTokenPayload
): Promise<string> => {
  const tokenId = uuidv4();
  const redis = getRedisClient();

  await redis.setex(
    cacheKeys.refreshToken(tokenId),
    REFRESH_TOKEN_TTL,
    JSON.stringify(payload)
  );

  const refreshToken = jwt.sign({ tokenId }, env.jwt.refreshSecret, {
    expiresIn: "7d",
  });

  logger.debug({ userId: payload.userId, tokenId }, "token.refresh_issued");
  return refreshToken;
};

// ─────────────────────────────────────────────
// verifyRefreshToken
// Verifies JWT signature, extracts tokenId,
// looks up payload in Redis.
// Returns null if invalid, expired, or revoked.
// ─────────────────────────────────────────────
export const verifyRefreshToken = async (
  token: string
): Promise<(RefreshTokenPayload & { tokenId: string }) | null> => {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret) as {
      tokenId: string;
    };
    const redis = getRedisClient();

    const raw = await redis.get(cacheKeys.refreshToken(decoded.tokenId));
    if (!raw) {
      // Not in Redis — either revoked on logout or naturally expired
      logger.warn({ tokenId: decoded.tokenId }, "token.refresh_not_in_redis");
      return null;
    }

    const payload = JSON.parse(raw) as RefreshTokenPayload;
    return { ...payload, tokenId: decoded.tokenId };
  } catch {
    // JWT signature invalid or expired
    return null;
  }
};

// ─────────────────────────────────────────────
// revokeRefreshToken
// Deletes the Redis key — token is dead instantly.
// Called on logout and account deactivation.
// ─────────────────────────────────────────────
export const revokeRefreshToken = async (tokenId: string): Promise<void> => {
  const redis = getRedisClient();
  await redis.del(cacheKeys.refreshToken(tokenId));
  logger.debug({ tokenId }, "token.refresh_revoked");
};
