import express from "express";
import { type Request, type Response, type NextFunction } from "express";
import logger from "../config/logger.ts";
import env from "../config/env.ts";
import {
  routeDeltaToTerminal,
  broadcastDeltaToFleet,
} from "../services/sync.service.ts";
import { confirmRegistration } from "../services/registration.service.ts";
import {
  creditWallet,
  hasCrossedAboveThreshold,
  prisma,
} from "../services/ledger.service.ts";
import { buildDeltaCommand } from "../utils/parser.ts";
import { getRedisClient, redisKeys } from "../config/redis.ts";

const router = express.Router();

function requireAdminSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== env.admin.secret) {
    logger.warn({ ip: req.ip, path: req.path }, "admin.unauthorized_request");
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.use(requireAdminSecret);

router.post(
  "/poison-pill",
  async (req: Request<{}, {}, { terminalId: string }>, res: Response) => {
    const { terminalId } = req.body;
    if (!terminalId) {
      return res.status(400).json({ error: "terminalId is required" });
    }

    const log = logger.child({ terminalId });

    try {
      await prisma.terminal.update({
        where: { terminal_id: terminalId },
        data: { status: "LOCKED" },
      });

      const poisonCmd = "CMD:POISON_PILL";
      const redis = getRedisClient();
      await redis.lpush(redisKeys.terminalQueue(terminalId), poisonCmd);
      await routeDeltaToTerminal(terminalId, poisonCmd);

      log.warn({ poisonCmd }, "admin.poison_pill_queued");
      res.json({
        success: true,
        message: `Poison pill queued for ${terminalId}`,
      });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.error({ err: errMessage }, "admin.poison_pill_error");
      res.status(500).json({ error: "Failed to issue poison pill" });
    }
  }
);

router.post(
  "/ota",
  async (req: Request<{}, {}, { firmwareUrl: string }>, res: Response) => {
    const { firmwareUrl } = req.body;

    if (!firmwareUrl || !firmwareUrl.startsWith("https://")) {
      return res
        .status(400)
        .json({ error: "firmwareUrl must be a valid HTTPS URL" });
    }

    const otaCmd = `CMD:OTA,${firmwareUrl}`;
    logger.info({ firmwareUrl }, "admin.ota_broadcast_initiated");

    try {
      await broadcastDeltaToFleet(otaCmd);
      res.json({ success: true, message: "OTA command broadcast to fleet" });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: errMessage }, "admin.ota_broadcast_error");
      res.status(500).json({ error: "OTA broadcast failed" });
    }
  }
);

router.post(
  "/confirm-registration",
  async (
    req: Request<{}, {}, { otp: string; studentId: string }>,
    res: Response
  ) => {
    const { otp, studentId } = req.body;

    if (!otp || !studentId) {
      return res.status(400).json({
        success: false,
        message:
          "Both otp and studentId are required for agent-assisted linking",
      });
    }

    try {
      const result = await confirmRegistration(otp, studentId);

      if (result.success) {
        logger.info(
          { agentIp: req.ip, studentId },
          "admin.agent_linked_card_success"
        );
        return res.status(200).json(result);
      }

      return res.status(400).json(result);
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: errMessage }, "admin.agent_link_error");
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

router.post(
  "/monnify-webhook",
  async (
    req: Request<{}, {}, { studentUid: string; amount: string | number }>,
    res: Response
  ) => {
    res.status(200).json({ received: true });

    const { studentUid, amount } = req.body;
    const log = logger.child({ studentUid, amount });
    const parsedAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    if (!studentUid || !amount || isNaN(parsedAmount)) {
      log.warn("admin.monnify_webhook_invalid_payload");
      return;
    }

    try {
      const result = await creditWallet(studentUid, parsedAmount);

      if (!result) {
        log.warn("admin.monnify_webhook_wallet_not_found");
        return;
      }

      const { previousBalance, newBalance } = result;

      if (hasCrossedAboveThreshold(previousBalance, newBalance)) {
        const removeBlCmd = buildDeltaCommand("REM", "BL", studentUid);
        log.info(
          { removeBlCmd, previousBalance, newBalance },
          "admin.monnify_threshold_crossed"
        );
        await broadcastDeltaToFleet(removeBlCmd);
      }
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.error({ err: errMessage }, "admin.monnify_webhook_processing_error");
    }
  }
);

router.post(
  "/terminal/register",
  async (
    req: Request<{}, {}, { terminalId: string; secretKey: string }>,
    res: Response
  ) => {
    const { terminalId, secretKey } = req.body;

    if (!terminalId || !secretKey) {
      return res
        .status(400)
        .json({ error: "terminalId and secretKey are required" });
    }

    try {
      const terminal = await prisma.terminal.upsert({
        where: { terminal_id: terminalId },
        update: { secret_key: secretKey },
        create: {
          terminal_id: terminalId,
          status: "OFFLINE",
          secret_key: secretKey,
        },
      });

      logger.info({ terminalId }, "admin.terminal_registered");
      res.json({ success: true, terminal });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: errMessage }, "admin.terminal_registration_error");
      res.status(500).json({ error: "Failed to register terminal" });
    }
  }
);

export default router;
