'use strict';
import { getRedisClient, redisKeys, OTP_TTL_SECONDS } from '../config/redis.js';
import { activateWallet, prisma } from './ledger.service.js';
import { buildDeltaCommand } from '../utils/parser.js';
import { routeDeltaToTerminal, broadcastDeltaToFleet } from './sync.service.js';
import logger from '../config/logger.js';
async function handlePendingLink(terminalId, linkData) {
  const redis = getRedisClient();
  const log = logger.child({ terminalId, uid: linkData.uid, otp: linkData.otp });
  const key = redisKeys.linkOtp(linkData.otp);
  const value = `${linkData.uid}|${terminalId}`;
  await redis.setex(key, OTP_TTL_SECONDS, value);
  log.info(
    { ttlSeconds: OTP_TTL_SECONDS, cacheKey: key },
    'registration.otp_cached — awaiting mobile app confirmation'
  );
}
async function confirmRegistration(otp) {
  const redis = getRedisClient();
  const log = logger.child({ otp });
  const key = redisKeys.linkOtp(otp);
  const cached = await redis.get(key);
  if (!cached) {
    log.warn('registration.otp_not_found_or_expired');
    return {
      success: false,
      message: 'OTP has expired or is invalid. Agent must generate a new code.',
    };
  }
  const [uid, originTerminalId] = cached.split('|');
  if (!uid || !originTerminalId) {
    log.error({ cached }, 'registration.malformed_cache_value');
    return { success: false, message: 'Internal registration state corrupted.' };
  }
  log.info({ uid, originTerminalId }, 'registration.otp_confirmed');
  try {
    await activateWallet(uid);
  } catch (err) {
    log.error({ err: err.message, uid }, 'registration.wallet_activation_failed');
    return { success: false, message: 'Database error during wallet activation.' };
  }
  await redis.del(key);
  log.debug({ key }, 'registration.otp_consumed_from_redis');
  const addWlCmd = buildDeltaCommand('ADD', 'WL', uid);
  try {
    await routeDeltaToTerminal(originTerminalId, addWlCmd);
    log.info({ originTerminalId, addWlCmd }, 'registration.origin_terminal_synced');
  } catch (err) {
    log.error({ err: err.message }, 'registration.origin_sync_failed');
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
      { terminalCount: allTerminals.length, addWlCmd },
      'registration.fleet_sync_queued'
    );
  } catch (err) {
    log.error({ err: err.message }, 'registration.fleet_sync_error');
  }
  return { success: true, message: 'Card successfully linked and activated.', uid };
}
export { handlePendingLink, confirmRegistration };
