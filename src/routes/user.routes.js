import express from "express";
import {
  fetchUserCount,
  fetchAllUsers,
  fetchProfile,
  updateProfile,
  changePassword,
  requestForgotPassword,
  resetForgotPassword
} from "../controller/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Forgot Password Routes (No Authentication Required) ───────────────────────
router.post("/forgot-password", requestForgotPassword);
router.post("/reset-password", resetForgotPassword);

// ── Protected Routes (Authentication Required) ────────────────────────────────
router.use(authenticateToken);

router.get("/count", fetchUserCount);
router.get("/", fetchAllUsers);
router.get("/myprofile", fetchProfile);
router.patch("/update-profile", updateProfile);
router.patch("/change-password", changePassword);

export default router;
