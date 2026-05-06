"use strict";
import "dotenv/config";
const REQUIRED_VARS = [
  "HIVEMQ_HOST",
  "HIVEMQ_PORT",
  "HIVEMQ_USERNAME",
  "HIVEMQ_PASSWORD",
  "HIVEMQ_CLIENT_ID",
  "DATABASE_URL",
  "REDIS_URL",
  "ADMIN_API_SECRET",
  "JWT_SECRET",
  "OTP_SECRET",
  "MAIL_USER",
  "MAIL_PASSWORD",
  "ALLOWED_EMAIL_DOMAIN",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  process.stderr.write(
    JSON.stringify({
      level: "fatal",
      msg: "Missing required environment variables. Halting.",
      missing,
    }) + "\n"
  );
  process.exit(1);
}
const parseIntSafe = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const parseFloatSafe = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const env = {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: parseIntSafe(process.env.PORT, 3000),
  mqtt: {
    host: process.env.HIVEMQ_HOST,
    port: parseIntSafe(process.env.HIVEMQ_PORT, 8883),
    username: process.env.HIVEMQ_USERNAME,
    password: process.env.HIVEMQ_PASSWORD,
    clientId: process.env.HIVEMQ_CLIENT_ID,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  ledger: {
    baseFare: parseFloatSafe(process.env.BASE_FARE, 150),
  },
  admin: {
    secret: process.env.ADMIN_API_SECRET,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  otp: {
    secret: process.env.OTP_SECRET,
  },
  mail: {
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
  },
  auth: {
    allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
export default env;
