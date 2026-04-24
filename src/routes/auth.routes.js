import express from "express";
import {
  registerStudent,
  verifyOTP,
  resendOTP,
  loginStudent,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", loginStudent);

export default router;
