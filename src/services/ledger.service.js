'use strict';

import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';
import env from '../config/env.js';

const prisma = new PrismaClient();

/**
 * Deduct a fare using ATOMIC database operations to prevent race conditions.
 * Accepts an optional dbClient so it can be wrapped in a larger transaction.
 */
async function deductFare(studentUid, amount, transactionId, dbClient = prisma) {
  const childLogger = logger.child({ transactionId, studentUid, amount });

  // 1. Check if wallet exists first to avoid Prisma throwing an error
  const wallet = await dbClient.wallet.findUnique({
    where: { student_uid: studentUid },
    select: { balance: true },
  });

  if (!wallet) {
    childLogger.warn('ledger.wallet_not_found — skipping deduction');
    return { newBalance: null, walletFound: false };
  }

  // 2. ATOMIC DECREMENT: Postgres does the math, completely blocking race conditions.
  const updatedWallet = await dbClient.wallet.update({
    where: { student_uid: studentUid },
    data: { balance: { decrement: amount } },
    select: { balance: true },
  });

  const newBalance = parseFloat(updatedWallet.balance);
  childLogger.info({ previousBalance: parseFloat(wallet.balance), newBalance }, 'ledger.fare_deducted');

  return { newBalance, walletFound: true };
}

function isBelowThreshold(balance) {
  return balance < env.ledger.baseFare;
}

function hasCrossedAboveThreshold(previousBalance, newBalance) {
  return previousBalance < env.ledger.baseFare && newBalance >= env.ledger.baseFare;
}

async function activateWallet(studentUid) {
  await prisma.wallet.upsert({
    where: { student_uid: studentUid },
    update: { is_linked: true },
    create: { student_uid: studentUid, balance: 0, is_linked: true },
  });
  logger.info({ studentUid }, 'ledger.wallet_activated');
}

/**
 * Credit wallet using ATOMIC increment.
 */
async function creditWallet(studentUid, amount, dbClient = prisma) {
  const wallet = await dbClient.wallet.findUnique({
    where: { student_uid: studentUid },
    select: { balance: true },
  });

  if (!wallet) {
    logger.warn({ studentUid }, 'ledger.credit_wallet_not_found');
    return null;
  }

  const updatedWallet = await dbClient.wallet.update({
    where: { student_uid: studentUid },
    data: { balance: { increment: amount } },
    select: { balance: true },
  });

  const previousBalance = parseFloat(wallet.balance);
  const newBalance = parseFloat(updatedWallet.balance);

  logger.info({ studentUid, previousBalance, newBalance, amount }, 'ledger.wallet_credited');
  return { previousBalance, newBalance };
}

export {
  deductFare,
  isBelowThreshold,
  hasCrossedAboveThreshold,
  activateWallet,
  creditWallet,
  prisma,
};
