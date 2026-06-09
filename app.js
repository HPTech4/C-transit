"use strict";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import logger from "./src/config/logger.ts";
import connectDB from "./src/config/db.ts";

import healthRouter from "./src/routes/health.routes.ts";
import adminRouter from "./src/routes/admin.routes.ts";
import authRoutes from "./src/routes/auth.routes.ts";
import userRoutes from "./src/routes/user.routes.ts";
import kycRoutes from "./src/routes/kyc.routes.ts";
import walletsRouter, {
  requireStudentAuth,
} from "./src/controller/wallets.controller.ts";
import { authenticateToken } from "./src/middleware/auth.middleware.ts";

const app = express();

app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://c-transit-new.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

connectDB();

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
      },
      "http.request"
    );
  });
  next();
});

app.get("/", (req, res) => {
  res.send("C-transit server is running");
});

app.use("/health", healthRouter);
app.use("/admin", adminRouter);

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/wallets", authenticateToken, requireStudentAuth, walletsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use((err, req, res, next) => {
  logger.error({ err: err.message, path: req.path }, "http.unhandled_error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
