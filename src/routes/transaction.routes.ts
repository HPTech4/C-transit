import { Router } from "express";
import { getTransactionHistory } from "../controller/transaction.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Protect this route so only authenticated users can hit it
router.get("/history", authenticateToken, getTransactionHistory);

export default router;
