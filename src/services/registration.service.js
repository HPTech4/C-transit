"use strict";

import { getRedisClient, redisKeys, OTP_TTL_SECONDS } from "../config/redis.js";
import { activateWallet, prisma } from "./ledger.service.js";
import { buildDeltaCommand } from "../utils/parser.js";
import { routeDeltaToTerminal, broadcastDeltaToFleet } from "./sync.service.js";
import { publishToTerminal } from "../mqtt/downlinkQueue.js";
import logger from "../config/logger.js";

async function handlePendingLink(terminalId, linkData) {
  const redis = getRedisClient();
  const log = logger.child({
    terminalId,
    cardUid: linkData.uid,
    otp: linkData.otp,
  });

  const key = redisKeys.linkOtp(linkData.otp);

  // Store: otp -> cardUid|terminalId
  const value = `${linkData.uid}|${terminalId}`;
  await redis.setex(key, OTP_TTL_SECONDS, value);

  log.info(
    { ttlSeconds: OTP_TTL_SECONDS, cacheKey: key },
    "registration.otp_cached"
  );

  // Send OTP back to terminal screen so that student can see it
  try {
    await publishToTerminal(terminalId, `REG:OTP,${linkData.otp}`);
    log.info({ otp: linkData.otp }, "registration.otp_sent_to_terminal_screen");
  } catch (err) {
    // OTP is in Redis, student can still get it another way
    log.error(
      { err: err.message },
      "registration.failed_to_send_otp_to_terminal"
    );
  }
}

async function confirmRegistration(otp, userId) {
  const redis = getRedisClient();
  const log = logger.child({ otp, userId });

  const key = redisKeys.linkOtp(otp);
  const cached = await redis.get(key);

  if (!cached) {
    log.warn("registration.otp_not_found_or_expired");
    return {
      success: false,
      message: "OTP has expired or is invalid. Please tap your card again.",
    };
  }

  const [cardUid, originTerminalId] = cached.split("|");

  if (!cardUid || !originTerminalId) {
    log.error({ cached }, "registration.malformed_cache_value");
    return {
      success: false,
      message: "Internal registration state corrupted.",
    };
  }

  // Verify the student exists in the DB using their matricNumber
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, matricNumber: true },
  });

  if (!user) {
    log.warn({ userId }, "registration.student_not_found");
    return {
      success: false,
      message: "Student not found. Please check your matric number.",
    };
  }

  log.info(
    { cardUid, originTerminalId, matricNumber: user.matricNumber },
    "registration.otp_confirmed"
  );

  try {
    await activateWallet(user.matricNumber);
    log.info(
      { matricNumber: user.matricNumber },
      "registration.wallet_activated"
    );
  } catch (err) {
    log.error({ err: err.message }, "registration.wallet_activation_failed");
    return {
      success: false,
      message: "Database error during wallet activation.",
    };
  }

  // Consume OTP — can't be reused
  await redis.del(key);
  log.debug({ key }, "registration.otp_consumed_from_redis");

  // Broadcast ADD:WL,matricNumber to all terminals
  const addWlCmd = buildDeltaCommand("ADD", "WL", user.matricNumber);

  try {
    await routeDeltaToTerminal(originTerminalId, addWlCmd);
    log.info(
      { originTerminalId, addWlCmd },
      "registration.origin_terminal_synced"
    );
  } catch (err) {
    log.error({ err: err.message }, "registration.origin_sync_failed");
  }

  try {
    const allTerminals = await prisma.terminal.findMany({
      where: { terminal_id: { not: originTerminalId } },
      select: { terminal_id: true },
    });
    await Promise.allSettled(
      allTerminals.map((t) => routeDeltaToTerminal(t.terminal_id, addWlCmd))
    );
    log.info(
      { terminalCount: allTerminals.length },
      "registration.fleet_sync_queued"
    );
  } catch (err) {
    log.error({ err: err.message }, "registration.fleet_sync_error");
  }

  return {
    success: true,
    message: "Card successfully linked and activated.",
    matricNumber: user.matricNumber,
    cardUid,
  };
}

export { handlePendingLink, confirmRegistration };
