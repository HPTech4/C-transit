"use strict";

import express from "express";
import {
  uploadIdCard,
  submitKycData,
  getKycStatus,
} from "../controller/kyc.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// All KYC routes require a valid JWT
router.use(authenticateToken);

router.post("/upload", upload.single("idCard"), uploadIdCard); // Step 1 — OCR
router.post("/submit", submitKycData); // Step 2 — Confirm & save
router.get("/status", getKycStatus); // Step 3 — Check status

export default router;
