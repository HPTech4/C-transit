import "dotenv/config";

const REQUIRED_VARS = [
  "HIVEMQ_HOST",
  "HIVEMQ_PORT",
  "HIVEMQ_CLIENT_ID",
  "DATABASE_URL",
  "DATABASE_URL_POOLED",
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
] as const;

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

const parseIntSafe = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseFloatSafe = (
  value: string | undefined,
  fallback: number
): number => {
  if (!value) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

interface Config {
  NODE_ENV: string;
  PORT: number;
  // ✅ Added db section — exposes both URLs for prisma.ts to consume
  db: {
    url: string; // Direct connection — migrations only
    pooledUrl: string; // Pooled via PgBouncer — all runtime queries
  };
  mqtt: {
    host: string;
    port: number;
    clientId: string;
  };
  redis: {
    url: string;
  };
  ledger: {
    baseFare: number;
  };
  admin: {
    secret: string;
  };
  jwt: {
    secret: string;
  };
  otp: {
    secret: string;
  };
  mail: {
    user: string;
    password: string;
  };
  auth: {
    allowedEmailDomain: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

const env: Config = {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: parseIntSafe(process.env.PORT, 3000),
  // ✅ db section now properly typed and exposed
  db: {
    url: process.env.DATABASE_URL as string,
    pooledUrl: process.env.DATABASE_URL_POOLED as string,
  },
  mqtt: {
    host: process.env.HIVEMQ_HOST as string,
    port: parseIntSafe(process.env.HIVEMQ_PORT, 1883),
    clientId: process.env.HIVEMQ_CLIENT_ID as string,
  },
  redis: {
    url: process.env.REDIS_URL as string,
  },
  ledger: {
    baseFare: parseFloatSafe(process.env.BASE_FARE, 150),
  },
  admin: {
    secret: process.env.ADMIN_API_SECRET as string,
  },
  jwt: {
    secret: process.env.JWT_SECRET as string,
  },
  otp: {
    secret: process.env.OTP_SECRET as string,
  },
  mail: {
    user: process.env.MAIL_USER as string,
    password: process.env.MAIL_PASSWORD as string,
  },
  auth: {
    allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN as string,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },
};

export default env;
