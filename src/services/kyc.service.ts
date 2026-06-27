// kyc.service.ts
"use strict";

import prisma from "../lib/prisma.js";
import cloudinary from "../config/cloudinary.js";
import { getRedisClient, cacheKeys } from "../config/redis.js";
import logger from "../config/logger.js";

// ─────────────────────────────────────────────
// uploadIdCardToCloudinary (internal)
// Streams buffer to Cloudinary. public_id is keyed
// by userId so re-uploads overwrite cleanly.
// ─────────────────────────────────────────────
const uploadIdCardToCloudinary = (
  fileBuffer: Buffer,
  userId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ctransit/kyc",
        public_id: `kyc_${userId}`,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url ?? "");
      }
    );
    stream.end(fileBuffer);
  });
};

// ─────────────────────────────────────────────
// submitKyc
// Single-step: upload image to Cloudinary, write
// KYC row with the resolved URL. If Cloudinary
// fails, nothing is written to DB.
// ─────────────────────────────────────────────
const submitKyc = async (userId: string, fileBuffer: Buffer) => {
  logger.info({ userId }, "kyc.upload_starting");

  const idCardImageUrl = await uploadIdCardToCloudinary(fileBuffer, userId);

  logger.info({ userId, idCardImageUrl }, "kyc.upload_complete");

  // Upsert instead of create — if the student resubmits (e.g. after rejection),
  // we overwrite the existing row rather than hitting the userId unique constraint.
  const kyc = await prisma.kyc.upsert({
    where: { userId },
    update: {
      idCardImageUrl,
      status: "PENDING", // Reset to PENDING on resubmission
      rejectionReason: null,
      reviewedAt: null,
      submittedAt: new Date(), // Refresh submission timestamp
    },
    create: {
      userId,
      idCardImageUrl,
    },
  });

  logger.info({ userId, kycId: kyc.id }, "kyc.submitted");
  return kyc;
};

const getKycByUserId = async (userId: string) => {
  return prisma.kyc.findUnique({ where: { userId } });
};

// ─────────────────────────────────────────────
// approveKyc
// Atomically: update KYC status + set user.isVerified
// + upsert wallet. Redis invalidation runs after
// commit — no false invalidation on rollback.
// Wallet starts at 0 — Monnify handles all top-ups.
// ─────────────────────────────────────────────
const approveKyc = async (userId: string) => {
  const redis = getRedisClient();

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

    await tx.wallet.upsert({
      where: { student_uid: user.matricNumber },
      update: { is_linked: true },
      create: {
        student_uid: user.matricNumber,
        balance: 0,
        is_linked: true,
      },
    });

    logger.info(
      { userId, matricNumber: user.matricNumber },
      "kyc.approved_wallet_created"
    );

    return { kyc, matricNumber: user.matricNumber };
  });

  await redis.del(cacheKeys.wallet(matricNumber));
  logger.debug({ matricNumber }, "kyc.wallet_cache_invalidated_after_approval");

  return kyc;
};

const rejectKyc = async (userId: string, reason: string) => {
  return prisma.kyc.update({
    where: { userId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });
};

// ─────────────────────────────────────────────
// getPendingKyc
// Agent queue — oldest-first.
// ─────────────────────────────────────────────
const getPendingKyc = async () => {
  return prisma.kyc.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      userId: true,
      idCardImageUrl: true,
      submittedAt: true,
    },
  });
};

export { submitKyc, getKycByUserId, approveKyc, rejectKyc, getPendingKyc };
