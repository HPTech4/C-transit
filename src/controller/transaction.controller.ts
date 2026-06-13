import type { Response } from "express";
import prisma from "../lib/prisma.js";
import logger from "../config/logger.js";
import type { AuthenticatedRequest } from "./auth.controller.js";

export const getTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Fetching exactly the specific fields you requested
    const transactions = await prisma.transaction.findMany({
      select: {
        amount: true, 
        type: true, 
        synced_at: true,
        terminal_id: true,
      },
      orderBy: {
        synced_at: "desc",
      },
    });

    logger.info({ count: transactions.length }, "transaction.history_fetched");

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
