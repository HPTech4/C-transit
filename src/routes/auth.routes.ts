import { Router } from "express";
import {
  registerStudent,
  verifyOTP,
  resendOTP,
  loginStudent,
  logoutStudent,
  confirmCard,
} from "../controller/auth.controller.js";
import agentRouter from "../controller/agent.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// ── Student auth ───────────────────────────────────────────────────────────
router.post("/register", registerStudent);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", loginStudent);
router.post("/logout", logoutStudent); // NOT TESTED YET
router.post("/confirm-card", authenticateToken, confirmCard); // NOT TESTED YET

// ── Agent auth ─────────────────────────────────────────────────────────────
// POST /auth/agent/login
// Agents do not self-register — accounts are created by admin only.
router.use("/agent", agentRouter);

export default router;
