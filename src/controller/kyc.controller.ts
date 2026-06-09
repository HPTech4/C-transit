import type { Request, Response } from "express";
import {
  processIdCard,
  submitKyc,
  getKycByUserId,
} from "../services/kyc.service.ts";
import logger from "../config/logger.ts";
import type { AuthenticatedRequest } from "./auth.controller.ts";

// Interface to support Multer's file injection
export interface KycUploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

export const uploadIdCard = async (req: KycUploadRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const result = await processIdCard(userId, req.file.buffer);

    res.status(200).json({
      message: "ID card processed. Please review the extracted fields.",
      data: result,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: errMessage }, "kyc.upload_error");
    res.status(500).json({ message: "Failed to process ID card" });
  }
};

/**
 * POST /api/kyc/submit
 * Student confirms the extracted fields and submits KYC.
 * This is what actually writes to the kyc_records table.
 */
export const submitKycData = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const kycData = req.body;
    const requiredFields = [
      "studentName",
      "studentId",
      "matricNumber",
      "school",
      "department",
      "phoneNumber",
      "idCardImageUrl",
    ];

    const missing = requiredFields.filter((f) => !kycData[f]);

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const kyc = await submitKyc(userId, kycData);

    res.status(201).json({
      message: "KYC submitted successfully. Pending admin review.",
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: errMessage }, "kyc.submit_error");
    res.status(400).json({ message: errMessage || "Failed to submit KYC" });
  }
};

/**
 * GET /api/kyc/status
 * Student checks their KYC status.
 */
export const getKycStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const kyc = await getKycByUserId(userId);

    if (!kyc) {
      return res.status(404).json({ message: "KYC not yet submitted" });
    }

    res.status(200).json({
      data: kyc.status,
      message: `Your KYC status is ${kyc.status}`,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: errMessage }, "kyc.status_error");
    res.status(500).json({ message: "Failed to fetch KYC status" });
  }
};
