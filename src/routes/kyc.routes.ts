import { Router } from "express";
import {
  uploadIdCard,
  submitKycData,
  getKycStatus,
} from "../controller/kyc.controller.ts";
import { authenticateToken } from "../middleware/auth.middleware.ts";
import upload from "../middleware/upload.middleware.ts";

const router = Router();

// All KYC routes require a valid JWT
router.use(authenticateToken);

router.post("/upload", upload.single("idCard"), uploadIdCard); // Step 1 — OCR
router.post("/submit", submitKycData); // Step 2 — Confirm & save
router.get("/status", getKycStatus); // Step 3 — Check status

export default router;
