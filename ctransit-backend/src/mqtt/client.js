'use strict';

const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const logger = require('../config/logger');
const { routeUplinkMessage } = require('./uplinkRouter');
const { injectClient, publishToTerminal } = require('./downlinkQueue');
const { injectMqttPublisher } = require('../services/syncService');

// ============================================================
// MQTT CLIENT — CONNECTION MANAGEMENT
//
// Connects to HiveMQ Cloud via MQTTS (TLS 1.2, Port 8883).
// Subscribes to all uplink and status topics via wildcards.
//
// CRITICAL — QoS 1 MANUAL ACK:
//   The mqtt package's `manualAcking: true` option disables
//   auto-acknowledgement. The broker holds the message in
//   "unacknowledged" state until we explicitly call
//   client.ack(packet) after successful DB write.
//
//   If this process crashes before ack, the broker will
//   re-deliver the message on reconnect. Hardware retains
//   its flash data. No data is ever lost.
// ============================================================

let client = null;

/**
 * Initialise and connect the MQTT client.
 * Sets up all event handlers and topic subscriptions.
 * Returns the connected client instance.
 *
 * @returns {Promise<mqtt.MqttClient>}
 */
function connectMqtt() {
  return new Promise((resolve, reject) => {
    logger.info(
      { brokerUrl: mqttConfig.brokerUrl, clientId: mqttConfig.options.clientId },
      'mqtt.connecting'
    );

    client = mqtt.connect(mqttConfig.brokerUrl, {
      ...mqttConfig.options,
      // CRITICAL: Disable auto-ack. We manually call client.ack(packet)
      // only after successful DB write in the message handler.
      manualAcking: true,
    });

    // ── Connection Events ─────────────────────────────────

    client.on('connect', (connack) => {
      logger.info({ sessionPresent: connack.sessionPresent }, 'mqtt.connected');

      // Inject this client into the downlink queue publisher
      injectClient(client);

      // Inject the publish function into syncService to break circular dep
      injectMqttPublisher(publishToTerminal);

      // Subscribe to all uplink topics (wildcard)
      const topics = {
        [mqttConfig.topics.uplinkWildcard]: { qos: mqttConfig.qos.uplink },
        [mqttConfig.topics.statusWildcard]: { qos: mqttConfig.qos.uplink },
      };

      client.subscribe(topics, (err, granted) => {
        if (err) {
          logger.fatal({ err: err.message }, 'mqtt.subscribe_failed');
          return reject(err);
        }
        logger.info({ granted }, 'mqtt.subscribed');
        resolve(client);
      });
    });

    // ── Message Handler ───────────────────────────────────
    // The core of the system. Every message from every terminal
    // passes through here. PUBACK is manually released ONLY after
    // the async processing chain completes successfully.

    client.on('message', async (topic, payload, packet) => {
      const topicLog = logger.child({ topic, packetMessageId: packet.messageId });
      topicLog.debug('mqtt.message_received');

      try {
        // Process the message — this awaits DB writes before returning
        await routeUplinkMessage(topic, payload);

        // ── PUBACK Released ───────────────────────────────
        // Only reached if routeUplinkMessage resolves without throwing.
        // This signals the broker that the message is fully processed.
        // The broker then signals the hardware to clear its flash buffer.
        client.ack(packet);
        topicLog.debug('mqtt.puback_released');
      } catch (err) {
        // Processing failed — DO NOT ACK.
        // Hardware retains data. Broker will re-deliver on next connection.
        topicLog.error(
          { err: err.message },
          'mqtt.message_processing_failed — PUBACK withheld — hardware will retry'
        );
        // Do not re-throw — the listener must stay alive for subsequent messages
      }
    });

    // ── Error & Reconnect Events ──────────────────────────

    client.on('error', (err) => {
      logger.error({ err: err.message }, 'mqtt.error');
      // mqtt.js handles reconnection automatically via reconnectPeriod
    });

    client.on('reconnect', () => {
      logger.warn('mqtt.reconnecting');
    });

    client.on('offline', () => {
      logger.warn('mqtt.offline — broker unreachable, queuing outbound messages');
    });

    client.on('close', () => {
      logger.warn('mqtt.connection_closed');
    });

    client.on('disconnect', (packet) => {
      logger.warn({ reasonCode: packet.reasonCode }, 'mqtt.disconnected_by_broker');
    });

    // Reject the promise if the initial connection fails outright
    client.on('error', (err) => {
      if (!client.connected) reject(err);
    });
  });
}

/**
 * Gracefully disconnect the MQTT client.
 * Called during process shutdown to send a clean DISCONNECT packet.
 */
function disconnectMqtt() {
  return new Promise((resolve) => {
    if (!client) return resolve();
    client.end(false, {}, () => {
      logger.info('mqtt.disconnected_gracefully');
      resolve();
    });
  });
}

module.exports = { connectMqtt, disconnectMqtt };
