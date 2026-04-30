'use strict';

import express from 'express';
import logger from '../config/logger.js';
import env from '../config/env.js';
import { routeDeltaToTerminal, broadcastDeltaToFleet } from '../services/syncService.js';
import { confirmRegistration } from '../services/registrationService.js';
import { creditWallet, hasCrossedAboveThreshold, prisma } from '../services/ledgerService.js';
import { buildDeltaCommand } from '../utils/parser.js';
import { getRedisClient, redisKeys } from '../config/redis.js';

const router = express.Router();

// ============================================================
// ADMIN API ROUTES
// All routes are protected by API secret key middleware.
// These are internal/operational endpoints — not public-facing.
// ============================================================

// ── Auth Middleware ───────────────────────────────────────

function requireAdminSecret(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== env.admin.secret) {
    logger.warn({ ip: req.ip, path: req.path }, 'admin.unauthorized_request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(requireAdminSecret);

// ── POST /admin/poison-pill ───────────────────────────────
// Mark a terminal as stolen and deliver the wipe command.
// SAD §1.6.1

router.post('/poison-pill', async (req, res) => {
  const { terminalId } = req.body;

  if (!terminalId) {
    return res.status(400).json({ error: 'terminalId is required' });
  }

  const log = logger.child({ terminalId });

  try {
    // Update terminal status to LOCKED in DB
    await prisma.terminal.update({
      where: { terminal_id: terminalId },
      data: { status: 'LOCKED' },
    });

    // Queue the poison pill — terminal may be offline, so always queue
    const poisonCmd = 'CMD:POISON_PILL';
    const redis = getRedisClient();
    await redis.lpush(redisKeys.terminalQueue(terminalId), poisonCmd);

    // Also attempt direct publish if terminal happens to be online
    await routeDeltaToTerminal(terminalId, poisonCmd);

    log.warn({ poisonCmd }, 'admin.poison_pill_queued');
    res.json({ success: true, message: `Poison pill queued for ${terminalId}` });
  } catch (err) {
    log.error({ err: err.message }, 'admin.poison_pill_error');
    res.status(500).json({ error: 'Failed to issue poison pill' });
  }
});

// ── POST /admin/ota ───────────────────────────────────────
// Trigger OTA firmware update across the fleet.
// Hardware receives URL, downloads binary via SIM800L HTTP.
// SAD §1.6.3

router.post('/ota', async (req, res) => {
  const { firmwareUrl } = req.body;

  if (!firmwareUrl || !firmwareUrl.startsWith('https://')) {
    return res.status(400).json({ error: 'firmwareUrl must be a valid HTTPS URL' });
  }

  const otaCmd = `CMD:OTA,${firmwareUrl}`;
  logger.info({ firmwareUrl }, 'admin.ota_broadcast_initiated');

  try {
    await broadcastDeltaToFleet(otaCmd);
    res.json({ success: true, message: 'OTA command broadcast to fleet' });
  } catch (err) {
    logger.error({ err: err.message }, 'admin.ota_broadcast_error');
    res.status(500).json({ error: 'OTA broadcast failed' });
  }
});

// ── POST /admin/confirm-registration ─────────────────────
// Used by Agents/Staff to manually link a card for a student.
router.post('/confirm-registration', async (req, res) => {
  // 🚨 Crucial Difference: The agent must explicitly provide the target studentId
  const { otp, studentId } = req.body;

  if (!otp || !studentId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both otp and studentId are required for agent-assisted linking' 
    });
  }

  try {
    // Pass the explicitly provided studentId to the business logic
    const result = await confirmRegistration(otp, studentId);

    if (result.success) {
      logger.info({ agentIp: req.ip, studentId }, 'admin.agent_linked_card_success');
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (err) {
    logger.error({ err: err.message }, 'admin.agent_link_error');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /admin/monnify-webhook ───────────────────────────
// Receive top-up notifications from Monnify.
// Credits wallet and triggers REM:BL if balance crosses threshold.
// SAD §1.4.3 — Monnify is STRICTLY for funding events only.

router.post('/monnify-webhook', async (req, res) => {
  // Acknowledge webhook immediately to prevent Monnify retries
  // while we process asynchronously.
  res.status(200).json({ received: true });

  const { studentUid, amount } = req.body;
  const log = logger.child({ studentUid, amount });

  if (!studentUid || !amount || isNaN(parseFloat(amount))) {
    log.warn('admin.monnify_webhook_invalid_payload');
    return;
  }

  try {
    const result = await creditWallet(studentUid, parseFloat(amount));

    if (!result) {
      log.warn('admin.monnify_webhook_wallet_not_found');
      return;
    }

    const { previousBalance, newBalance } = result;

    // Threshold check: did the top-up bring the balance above the base fare?
    if (hasCrossedAboveThreshold(previousBalance, newBalance)) {
      const removeBlCmd = buildDeltaCommand('REM', 'BL', studentUid);
      log.info({ removeBlCmd, previousBalance, newBalance }, 'admin.monnify_threshold_crossed — broadcasting whitelist restore');
      await broadcastDeltaToFleet(removeBlCmd);
    }
  } catch (err) {
    log.error({ err: err.message }, 'admin.monnify_webhook_processing_error');
  }
});

// ── POST /admin/terminal/register ────────────────────────
// Provision a new terminal in the DB before it connects.

router.post('/terminal/register', async (req, res) => {
  const { terminalId, secretKey } = req.body;

  if (!terminalId || !secretKey) {
    return res.status(400).json({ error: 'terminalId and secretKey are required' });
  }

  try {
    const terminal = await prisma.terminal.upsert({
      where: { terminal_id: terminalId },
      update: { secret_key: secretKey },
      create: {
        terminal_id: terminalId,
        status: 'OFFLINE',
        secret_key: secretKey,
      },
    });

    logger.info({ terminalId }, 'admin.terminal_registered');
    res.json({ success: true, terminal });
  } catch (err) {
    logger.error({ err: err.message }, 'admin.terminal_registration_error');
    res.status(500).json({ error: 'Failed to register terminal' });
  }
});

export default router;
