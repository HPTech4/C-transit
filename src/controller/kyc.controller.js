"use strict";

import {
  processIdCard,
  submitKyc,
  getKycByUserId,
} from "../services/kyc.service.js";
import logger from "../config/logger.js";

/**
 * POST /api/kyc/upload
 * Student uploads ID card — OCR runs and extracted fields are returned
 * for preview. Nothing is saved to the KYC table yet.
 */
export const uploadIdCard = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const result = await processIdCard(userId, req.file.buffer);

    res.status(200).json({
      message: "ID card processed. Please review the extracted fields.",
      data: result, // Frontend displays these for student to confirm
    });
  } catch (error) {
    logger.error({ err: error.message }, "kyc.upload_error");
    res.status(500).json({ message: "Failed to process ID card" });
  }
};

/**
 * POST /api/kyc/submit
 * Student confirms the extracted fields and submits KYC.
 * This is what actually writes to the kyc_records table.
 */
export const submitKycData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const kycData = req.body;

    const requiredFields = [
      "studentName",
      "studentId",
      "matricNumber",
      "school",
      "department",
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
      data: kyc,
    });
  } catch (error) {
    logger.error({ err: error.message }, "kyc.submit_error");
    res.status(400).json({ message: error.message || "Failed to submit KYC" });
  }
};

/**
 * GET /api/kyc/status
 * Student checks their KYC status.
 */
export const getKycStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const kyc = await getKycByUserId(userId);

    if (!kyc) {
      return res.status(404).json({ message: "KYC not yet submitted" });
    }

    res.status(200).json({ data: kyc });
  } catch (error) {
    logger.error({ err: error.message }, "kyc.status_error");
    res.status(500).json({ message: "Failed to fetch KYC status" });
  }
};
