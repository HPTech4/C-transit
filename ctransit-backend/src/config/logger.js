'use strict';

const pino = require('pino');
const env = require('./env');

// ============================================================
// PINO LOGGER — STRUCTURED JSON ONLY
// No console.log permitted anywhere in this codebase.
// In production: pure JSON to stdout for log aggregators.
// In development: pretty-printed for readability.
// ============================================================

const logger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: {
      service: 'ctransit-backend-hardware-link',
      env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    // Redact sensitive fields from logs if they accidentally appear
    redact: {
      paths: ['mqtt.password', 'redis.password', '*.secret_key'],
      censor: '[REDACTED]',
    },
  },
  env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,service',
        },
      })
    : pino.destination({ sync: false }) // Async writes in production
);

module.exports = logger;
