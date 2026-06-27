import { Router } from "express";
import {
  authenticateToken,
  requireStudent,
} from "../middleware/auth.middleware.js";
import disputeController from "../controller/dispute.controller.js";

const router = Router();

// Students only — disputes are raised and viewed by the affected student
router.use(authenticateToken, requireStudent);
router.use("/", disputeController);

export default router;
