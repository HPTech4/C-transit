'use strict';
import pino from 'pino';
import env from './env.js';
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
    : pino.destination({ sync: false })
);
export default logger;
