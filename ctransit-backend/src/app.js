'use strict';

const express = require('express');
const logger = require('./config/logger');

const healthRouter = require('./routes/health');
const adminRouter = require('./routes/admin');

// ============================================================
// EXPRESS APPLICATION
// Minimal HTTP surface — the real work is done over MQTT.
// HTTP endpoints handle: health checks, admin operations,
// Monnify webhooks, and mobile app registration confirms.
// ============================================================

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Reject oversized payloads
app.use(express.urlencoded({ extended: false }));

// ── Request Logging ────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
      },
      'http.request'
    );
  });
  next();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/admin', adminRouter);

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ err: err.message, path: req.path }, 'http.unhandled_error');
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
