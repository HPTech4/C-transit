"use strict";

import prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { extractTextFromImage, parseIdCardText } from "./ocr.service.js";// Add getRedisClient and cacheKeys to the existing logger import line
import { getRedisClient, cacheKeys } from "../config/redis.js"; // ✅ Add this line
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
  const redis = getRedisClient();

  // ✅ Transaction now returns { kyc, matricNumber } so we can
  // invalidate the wallet cache AFTER the transaction commits.
  // We cannot call redis.del() inside the transaction — Redis and
  // Prisma are separate systems; the transaction could still roll back.
  const { kyc, matricNumber } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { matricNumber: true },
    });

    if (!user) throw new Error("User not found");

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

    // Test balance: 1500 NGN = 10 rides at 150 NGN each
    // Change balance to 0 when Monnify payment API is live
    await tx.wallet.upsert({
      where: { student_uid: user.matricNumber },
      update: { is_linked: true },
      create: {
        student_uid: user.matricNumber,
        balance: 1500,
        is_linked: true,
      },
    });

    logger.info(
      { userId, matricNumber: user.matricNumber },
      "kyc.approved_wallet_created"
    );

    // ✅ Return matricNumber alongside kyc so it's available outside the transaction
    return { kyc, matricNumber: user.matricNumber };
  });

  // ✅ Invalidate wallet cache AFTER transaction commits successfully.
  // If the transaction rolled back, we never reach here — no false invalidation.
  await redis.del(cacheKeys.wallet(matricNumber));

  logger.debug({ matricNumber }, "kyc.wallet_cache_invalidated_after_approval");

  return kyc;
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

// ─────────────────────────────────────────────
// getPendingKyc
// Agent KYC queue — returns all PENDING submissions
// ordered oldest-first so agents work through them
// in the order students submitted.
// secret_key and password never appear in KYC data
// but faceImageUrl is included so the agent can
// visually verify the ID card photo.
// ─────────────────────────────────────────────
const getPendingKyc = async () => {
  return prisma.kyc.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      userId: true,
      studentName: true,
      matricNumber: true,
      school: true,
      department: true,
      phoneNumber: true,
      idCardImageUrl: true,
      faceImageUrl: true,
      submittedAt: true,
    },
  });
};

export {
  processIdCard,
  submitKyc,
  getKycByUserId,
  approveKyc,
  rejectKyc,
  getPendingKyc,
};
