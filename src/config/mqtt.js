"use strict";

import env from "./env.js";

const mqttConfig = {
  brokerUrl: `mqtts://${env.mqtt.host}:${env.mqtt.port}`,

  options: {
    clientId: env.mqtt.clientId,
    username: env.mqtt.username,
    password: env.mqtt.password,
    protocol: "mqtts",
    port: env.mqtt.port,
    rejectUnauthorized: true,
    keepalive: 60,
    connectTimeout: 30 * 1000,
    reconnectPeriod: 5000,
    clean: false,
    will: {
      topic: "ctransit/server/status",
      payload: "OFFLINE",
      qos: 1,
      retain: false,
    },
  },

  topics: {
    uplinkWildcard: "ctransit/+/tx",
    statusWildcard: "ctransit/+/status",
    downlink: (terminalId) => `ctransit/${terminalId}/rx`,
  },

  qos: {
    uplink: 1,
    downlink: 1,
  },
};

export default mqttConfig;
