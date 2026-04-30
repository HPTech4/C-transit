'use strict';

import mqttConfig from '../config/mqtt.js';
import logger from '../config/logger.js';

// ============================================================
// DOWNLINK QUEUE — MQTT PUBLISH ENGINE
// Publishes compressed delta strings to terminal rx topics.
// QoS 1: broker confirms delivery. Hardware confirms via its
// own PUBACK loop on the subscribe side.
//
// This module holds a reference to the live MQTT client,
// injected after connection is established in client.js.
// ============================================================

let _client = null;

/**
 * Inject the live MQTT client instance.
 * Called once from client.js after broker connection is confirmed.
 * @param {Object} client - mqtt.Client instance
 */
function injectClient(client) {
  _client = client;
}

/**
 * Publish a delta command to a specific terminal's rx topic.
 * Returns a Promise that resolves when broker confirms the publish (QoS 1 PUBACK).
 *
 * @param {string} terminalId - e.g., 'TERM_04'
 * @param {string} command - e.g., 'ADD:BL,A1B2C3D4'
 * @returns {Promise<void>}
 */
function publishToTerminal(terminalId, command) {
  return new Promise((resolve, reject) => {
    if (!_client || !_client.connected) {
      const err = new Error('MQTT client not connected — cannot publish downlink');
      logger.error({ terminalId, command, err: err.message }, 'downlink.publish_failed_no_client');
      return reject(err);
    }

    const topic = mqttConfig.topics.downlink(terminalId);
    const log = logger.child({ terminalId, topic, command });

    _client.publish(
      topic,
      command,
      { qos: mqttConfig.qos.downlink, retain: false },
      (err) => {
        if (err) {
          log.error({ err: err.message }, 'downlink.publish_error');
          return reject(err);
        }
        log.info('downlink.published');
        resolve();
      }
    );
  });
}

export { injectClient, publishToTerminal };
