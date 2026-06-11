import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import logger from "../config/logger.js";
import env from "../config/env.js";

// Define the expected structure of your JWT payload
export interface UserJwtPayload extends JwtPayload {
  userId: string;
  role: string | "ADMIN" | "AGENT" | "STUDENT";
  email?: string;
}

// Extend the Express Request to include the decoded user payload
export interface CustomAuthRequest extends Request {
  user?: UserJwtPayload;
}

function authenticateToken(
  req: CustomAuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn({ ip: req.ip, path: req.path }, "auth.no_token_provided");
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Verify and cast the payload to our custom interface
    const decoded = jwt.verify(token, env.jwt.secret) as UserJwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn(
      { ip: req.ip, err: errMessage },
      "auth.token_verification_failed"
    );
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(
  req: CustomAuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "AGENT")) {
    logger.warn(
      { userId: req.user?.userId, role: req.user?.role },
      "auth.insufficient_permissions"
    );
    return res.status(403).json({ error: "Admin or Agent role required" });
  }
  next();
}

function requireStudent(
  req: CustomAuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "STUDENT") {
    logger.warn(
      { userId: req.user?.userId, role: req.user?.role },
      "auth.insufficient_permissions"
    );
    return res.status(403).json({ error: "Student role required" });
  }
  next();
}

export { authenticateToken, requireAdmin, requireStudent };
