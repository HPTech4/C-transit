'use strict';

const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const logger = require('../config/logger');
const { routeUplinkMessage } = require('./uplinkRouter');
const { injectClient, publishToTerminal } = require('./downlinkQueue');
const { injectMqttPublisher } = require('../services/syncService');

// ============================================================
// MQTT CLIENT — CONNECTION MANAGEMENT
// ============================================================

let client = null;

function connectMqtt() {
  return new Promise((resolve, reject) => {
    logger.info(
      { brokerUrl: mqttConfig.brokerUrl, clientId: mqttConfig.options.clientId },
      'mqtt.connecting'
    );

    client = mqtt.connect(mqttConfig.brokerUrl, {
      ...mqttConfig.options,
      protocolVersion: 5, // Required to unlock advanced manual acking
      
      // 🔥 THE FIX: This replaces both the old auto-ack and the message listener
      customHandleAcks: function (topic, message, packet, done) {
        const topicLog = logger.child({ topic, packetMessageId: packet.messageId });
        topicLog.debug('mqtt.message_received');

        // 1. Pass the payload to the router and WAIT for DB to finish
        routeUplinkMessage(topic, message)
          .then(() => {
            // 2. Success! Database is safe. Send the PUBACK to the bus.
            topicLog.debug('mqtt.puback_released');
            done(null, 0); 
          })
          .catch((err) => {
            // 3. Database Crash! Withhold PUBACK. 
            // Hardware will keep the data on its SD card and retry later.
            topicLog.error(
              { err: err.message },
              'mqtt.message_processing_failed — PUBACK withheld — hardware will retry'
            );
            done(err); 
          });
      }
    });

    // ── Connection Events ─────────────────────────────────

    client.on('connect', (connack) => {
      logger.info({ sessionPresent: connack.sessionPresent }, 'mqtt.connected');

      // Inject dependencies
      injectClient(client);
      injectMqttPublisher(publishToTerminal);

      // Subscribe to all uplink topics (QoS 1 is required for the ack hostage logic)
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

    // ── Error & Reconnect Events ──────────────────────────

    client.on('error', (err) => {
      logger.error({ err: err.message }, 'mqtt.error');
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
