"use strict";

import prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { extractTextFromImage, parseIdCardText } from "./ocr.service.js";
import logger from "../config/logger.js";

/**
 * Uploads image buffer to Cloudinary and returns the secure URL.
 * @param {Buffer} fileBuffer - Image buffer from multer memoryStorage
 * @param {string} userId - Used to name the file in Cloudinary
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadIdCardToCloudinary = (fileBuffer, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ctransit/kyc",
        public_id: `kyc_${userId}`,
        overwrite: true,
        resource_type: "image",

        faces: true, // Enable face detection to optimize for ID cards[cite: 4, 15]
      },
      (error, result) => {
        if (error) return reject(error);

        const faceImageUrl =
          result.faces?.length > 0
            ? cloudinary.url(`ctransit/kyc/kyc_${userId}`, {
                transformation: [
                  { width: 200, height: 200, gravity: "face", crop: "thumb" },
                ],
              })
            : null;

        resolve({
          idCardImageUrl: result.secure_url,
          faceImageUrl,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * STEP 1 — Preprocess, run OCR, then upload to Cloudinary.
 * Order matters: OCR runs on the sharp-cleaned buffer,
 * but the original image is what gets stored on Cloudinary.
 *
 * @param {string} userId
 * @param {Buffer} fileBuffer - Raw image buffer from multer
 * @returns {Promise<object>} Extracted KYC fields + image URL
 */
const processIdCard = async (userId, fileBuffer) => {
  // Run OCR on the sharp-preprocessed buffer — not the raw upload
  const rawText = await extractTextFromImage(fileBuffer);
  const extractedFields = parseIdCardText(rawText);

  // Upload the original image to Cloudinary for admin review
    const { idCardImageUrl, faceImageUrl } = await uploadIdCardToCloudinary(
      fileBuffer,
      userId
    );

    logger.info(
      { userId, idCardImageUrl, faceImageUrl },
      "kyc.processing_complete"
    );

  return {
    idCardImageUrl,
    faceImageUrl,
    ...extractedFields,
  };
};

/**
 * STEP 2 — Save confirmed KYC data to the database.
 * Called after the student reviews and confirms the extracted fields.
 *
 * @param {string} userId
 * @param {object} kycData - Confirmed fields from frontend
 * @returns {Promise<object>} Saved KYC record
 */
const submitKyc = async (userId, kycData) => {
  const {
    studentName,
    studentId,
    matricNumber,
    school,
    department,
    idCardImageUrl,
    faceImageUrl,
  } = kycData;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.matricNumber !== matricNumber.toUpperCase()) {
    throw new Error(
      "Matric number on ID card does not match your registered matric number"
    );
  }

  const kyc = await prisma.kyc.upsert({
    where: { userId },
    update: {
      studentName,
      studentId,
      matricNumber,
      school,
      department,
      idCardImageUrl,
      faceImageUrl: faceImageUrl || null,
      status: "PENDING", // Matches KycStatus Enum
      rejectionReason: null,
      submittedAt: new Date(),
    },
    create: {
      userId,
      studentName,
      studentId,
      matricNumber,
      school,
      department,
      idCardImageUrl,
      faceImageUrl: faceImageUrl || null,
      status: "PENDING", // Matches KycStatus Enum[cite: 4, 15]
    },
  });

  logger.info({ userId, kycId: kyc.id }, "kyc.submitted");
  return kyc;
};

const getKycByUserId = async (userId) => {
  return prisma.kyc.findUnique({ where: { userId } });
};

/**
 * Admin — approve a KYC submission.
 * FIXED: Uses a transaction to update both the KYC record and the User verification flag[cite: 4, 15].
 */
const approveKyc = async (userId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update the KYC record to APPROVED
    const kyc = await tx.kyc.update({
      where: { userId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    // 2. Update the User record to officially verify the account
    await tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    return kyc;
  });
};

const rejectKyc = async (userId, reason) => {
  return prisma.kyc.update({
    where: { userId },
    data: {
      status: "REJECTED", // Matches KycStatus Enum[cite: 4, 15]
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });
};

export { processIdCard, submitKyc, getKycByUserId, approveKyc, rejectKyc };