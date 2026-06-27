// transaction.controller.ts
import type { Response } from "express";
import prisma from "../lib/prisma.js";
import logger from "../config/logger.js";
import type { AuthenticatedRequest } from "./auth.controller.js";

export const getTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Resolve matricNumber from userId — transaction table keys on
    // student_uid (matricNumber), not User.id, to match terminal records.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { matricNumber: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { student_uid: user.matricNumber }, // ← scope to this student only
      select: {
        amount: true,
        type: true,
        synced_at: true,
        terminal_id: true,
      },
      orderBy: { synced_at: "desc" },
    });

    logger.info(
      { studentUid: user.matricNumber, count: transactions.length },
      "transaction.history_fetched"
    );

    return res.status(200).json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: errMessage }, "transaction.history_error");
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
    });
  }
};
