'use strict';

require('dotenv').config();

// ============================================================
// ENVIRONMENT CONFIGURATION
// All env vars are validated at startup.
// The process exits immediately if any required var is missing.
// This prevents silent misconfiguration in production.
// ============================================================

const REQUIRED_VARS = [
  'HIVEMQ_HOST',
  'HIVEMQ_PORT',
  'HIVEMQ_USERNAME',
  'HIVEMQ_PASSWORD',
  'HIVEMQ_CLIENT_ID',
  'DATABASE_URL',
  'REDIS_HOST',
  'REDIS_PORT',
  'ADMIN_API_SECRET',
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Use process.stderr directly — logger is not yet initialised at this point
  process.stderr.write(
    JSON.stringify({
      level: 'fatal',
      msg: 'Missing required environment variables. Halting.',
      missing,
    }) + '\n'
  );
  process.exit(1);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT, 10) || 3000,

  mqtt: {
    host: process.env.HIVEMQ_HOST,
    port: parseInt(process.env.HIVEMQ_PORT, 10),
    username: process.env.HIVEMQ_USERNAME,
    password: process.env.HIVEMQ_PASSWORD,
    clientId: process.env.HIVEMQ_CLIENT_ID,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  ledger: {
    baseFare: parseFloat(process.env.BASE_FARE) || 150,
  },

  admin: {
    secret: process.env.ADMIN_API_SECRET,
  },
};

module.exports = env;
