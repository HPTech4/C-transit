// kyc.routes.ts
import { Router } from "express";
import {
  submitKycHandler,
  getKycStatus,
} from "../controller/kyc.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

// All KYC routes require a valid JWT
router.use(authenticateToken);

router.post("/submit", upload.single("idCard"), submitKycHandler); // Upload image + write KYC row in one step
router.get("/status", getKycStatus); // Student checks their KYC status

export default router;
