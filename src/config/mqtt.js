'use strict';

import env from './env.js';

// ============================================================
// HIVEMQ CLOUD — MQTTS CONNECTION OPTIONS
// TLS 1.2 is ENFORCED by the broker. Port 1883 is physically
// blocked. Node.js handles the TLS handshake natively using
// its built-in root CA certificates (no custom cert required
// for HiveMQ Cloud).
// ============================================================

const mqttConfig = {
  // mqtts:// forces TLS — never mqtt://
  brokerUrl: `mqtts://${env.mqtt.host}:${env.mqtt.port}`,

  options: {
    clientId: env.mqtt.clientId,
    username: env.mqtt.username,
    password: env.mqtt.password,
    protocol: 'mqtts',
    port: env.mqtt.port,

    // TLS — rely on Node.js built-in root CAs (HiveMQ Cloud uses a
    // publicly trusted certificate authority, no self-signed cert needed)
    rejectUnauthorized: true,

    // Connection resilience
    keepalive: 60,
    connectTimeout: 30 * 1000, // 30s

    // Reconnect strategy — exponential backoff via reconnectPeriod
    reconnectPeriod: 5000, // 5s between reconnect attempts
    clean: false, // Persistent session — broker retains QoS 1 msgs for us

    // QoS 1 Manual Ack — CRITICAL
    // manualAcking: true is set on the client in client.js
    // This config does not auto-ack; acks are fired only after DB write.

    // Last Will & Testament for the BACKEND server itself
    will: {
      topic: 'ctransit/server/status',
      payload: 'OFFLINE',
      qos: 1,
      retain: false,
    },
  },

  // Topic definitions — single source of truth
  topics: {
    uplinkWildcard: 'ctransit/+/tx',   // Subscribe: all terminal uplinks
    statusWildcard: 'ctransit/+/status', // Subscribe: all LWT events
    downlink: (terminalId) => `ctransit/${terminalId}/rx`, // Publish target
  },

  // QoS levels
  qos: {
    uplink: 1,   // At least once — requires manual PUBACK
    downlink: 1, // At least once — hardware must confirm receipt
  },
};

export default mqttConfig;
