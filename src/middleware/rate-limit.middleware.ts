// To adjust any limit: edit env.ts → rateLimit section only.
// No code changes needed here.

import rateLimit from "express-rate-limit";
import env from "../config/env.js";

// Factory so every limiter gets consistent error
// shape and logging-friendly headers.

// standardHeaders: true  → sends RateLimit-* headers (RFC 6585)
// legacyHeaders: false   → suppresses deprecated X-RateLimit-* headers
// ─
const buildLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    
    // keyGenerator defaults to req.ip — suitable for CTransit's scale.
    // If you add a reverse proxy later, set app.set('trust proxy', 1)
    // in app.ts so req.ip resolves the real client IP from X-Forwarded-For.
  });

const { rateLimit: rl } = env;

// Auth 
export const loginLimiter = buildLimiter(
  rl.login.windowMs,
  rl.login.max,
  "Too many login attempts. Please try again in 15 minutes."
);

export const adminLoginLimiter = buildLimiter(
  rl.adminLogin.windowMs,
  rl.adminLogin.max,
  "Too many admin login attempts. Please try again in 15 minutes."
);

export const registerLimiter = buildLimiter(
  rl.register.windowMs,
  rl.register.max,
  "Too many registration attempts. Please try again in an hour."
);

export const otpLimiter = buildLimiter(
  rl.otp.windowMs,
  rl.otp.max,
  "Too many OTP requests. Please try again in 15 minutes."
);

// KYC
export const kycSubmitLimiter = buildLimiter(
  rl.kyc.windowMs,
  rl.kyc.max,
  "Too many KYC submissions. Please try again in an hour."
);

export const kycStatusLimiter = buildLimiter(
  rl.kycStatus.windowMs,
  rl.kycStatus.max,
  "Too many status checks. Please try again in 15 minutes."
);

//  Transactions
export const transactionLimiter = buildLimiter(
  rl.transactions.windowMs,
  rl.transactions.max,
  "Too many transaction requests. Please try again in 15 minutes."
);

//  Wallets
export const walletLimiter = buildLimiter(
  rl.wallets.windowMs,
  rl.wallets.max,
  "Too many wallet requests. Please try again in 15 minutes."
);

//  Disputes 
export const disputeLimiter = buildLimiter(
  rl.disputes.windowMs,
  rl.disputes.max,
  "Too many dispute submissions. Please try again in an hour."
);

//  Notifications
export const notificationLimiter = buildLimiter(
  rl.notifications.windowMs,
  rl.notifications.max,
  "Too many notification requests. Please try again in 15 minutes."
);

//  Global fallback 
// Applied in app.ts before all routes.
// Specific limiters above override this for sensitive endpoints.
export const globalLimiter = buildLimiter(
  rl.global.windowMs,
  rl.global.max,
  "Too many requests. Please try again in 15 minutes."
);
