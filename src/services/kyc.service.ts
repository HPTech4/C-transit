"use strict";

import prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { extractTextFromImage, parseIdCardText } from "./ocr.service.js";
import logger from "../config/logger.js";

export interface KycSubmissionData {
  studentName: string;
  studentId: string;
  matricNumber: string;
  school: string;
  department: string;
  phoneNumber: string;
  idCardImageUrl: string;
  faceImageUrl?: string | null;
}

interface CloudinaryUploadResult {
  idCardImageUrl: string;
  faceImageUrl: string | null;
}

/**
 * Uploads image buffer to Cloudinary and returns the secure URL.
 */
const uploadIdCardToCloudinary = (
  fileBuffer: Buffer,
  userId: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ctransit/kyc",
        public_id: `kyc_${userId}`,
        overwrite: true,
        resource_type: "image",
        faces: true, // Enable face detection to optimize for ID cards
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload failed"));

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
 */
const processIdCard = async (userId: string, fileBuffer: Buffer) => {
  const rawText = await extractTextFromImage(fileBuffer);
  const extractedFields = parseIdCardText(rawText);

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
 */
const submitKyc = async (userId: string, kycData: KycSubmissionData) => {
  const {
    studentName,
    studentId,
    matricNumber,
    school,
    department,
    phoneNumber,
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
      phoneNumber,
      idCardImageUrl,
      faceImageUrl: faceImageUrl || null,
      status: "PENDING",
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
      phoneNumber,
      idCardImageUrl,
      faceImageUrl: faceImageUrl || null,
      status: "PENDING", // Matches KycStatus Enum
    },
  });

  logger.info({ userId, kycId: kyc.id }, "kyc.submitted");
  return kyc;
};

const getKycByUserId = async (userId: string) => {
  return prisma.kyc.findUnique({ where: { userId } });
};

/**
 * Admin — approve a KYC submission.
 * FIXED: Uses a transaction to update both the KYC record and the User verification flag.
 */
const approveKyc = async (userId: string) => {
  return prisma.$transaction(async (tx) => {
    const kyc = await tx.kyc.update({
      where: { userId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    return kyc;
  });
};

const rejectKyc = async (userId: string, reason: string) => {
  return prisma.kyc.update({
    where: { userId },
    data: {
      status: "REJECTED", // Matches KycStatus Enum
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });
};

export { processIdCard, submitKyc, getKycByUserId, approveKyc, rejectKyc };
