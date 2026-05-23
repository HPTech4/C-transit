import express from "express";
import {
  registerStudent,
  verifyOTP,
  resendOTP,
  loginStudent,
  confirmCard,
} from "../controller/auth.controller.js";
const router = express.Router();
router.post("/register", registerStudent);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", loginStudent);

import { authenticateToken } from "../middleware/auth.middleware.js";

router.post("/confirm-card", authenticateToken, confirmCard);
export default router;
