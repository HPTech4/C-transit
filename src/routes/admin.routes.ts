import { Router } from "express";
import adminRouter, {
  agentManagementRouter,
} from "../controller/admin.controller.js";

const router = Router();

// Secret-based system ops (poison pill, OTA, terminal register, Monnify webhook, KYC)
router.use("/", adminRouter);

// JWT-protected agent CRUD (create, list, detail, status update)
router.use("/", agentManagementRouter);

export default router;
