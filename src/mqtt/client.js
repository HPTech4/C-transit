'use strict';
import mqtt from 'mqtt';
import mqttConfig from '../config/mqtt.js';
import logger from '../config/logger.js';
import { routeUplinkMessage } from './uplinkRouter.js';
import { injectClient, publishToTerminal } from './downlinkQueue.js';
import { injectMqttPublisher } from '../services/sync.service.js';
let client = null;
function connectMqtt() {
  return new Promise((resolve, reject) => {
    logger.info(
      { brokerUrl: mqttConfig.brokerUrl, clientId: mqttConfig.options.clientId },
      'mqtt.connecting'
    );
    client = mqtt.connect(mqttConfig.brokerUrl, {
      ...mqttConfig.options,
      manualAcking: true,
    });
    client.on('connect', (connack) => {
      logger.info({ sessionPresent: connack.sessionPresent }, 'mqtt.connected');
      injectClient(client);
      injectMqttPublisher(publishToTerminal);
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
    client.on('message', async (topic, payload, packet) => {
      const topicLog = logger.child({ topic, packetMessageId: packet.messageId });
      topicLog.debug('mqtt.message_received');
      try {
        await routeUplinkMessage(topic, payload);
        topicLog.debug('mqtt.puback_released');
      } catch (err) {
        topicLog.error(
          { err: err.message },
          'mqtt.message_processing_failed — PUBACK withheld — hardware will retry'
        );
      }
    });
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
export { connectMqtt, disconnectMqtt };
