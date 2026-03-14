// index.js

const { connectMQTT } = require('./mqttClient');
const { setupTerminalListener, TOPIC_TX_FLUSH } = require('./terminalListener');
const { triggerOTAUpdate } = require('./terminalPublisher');

const TOPICS = {
    flush: TOPIC_TX_FLUSH,                      // ctransit/tx/flush 
    otaUpdate: 'ctransit/terminals/cmd/update' 
};


const mqttClient = connectMQTT();

// 2. Start Listener (Listens to ctransit/tx/flush and parses payloads) 
setupTerminalListener(mqttClient);

// 3. Expose module functions for the broader Node.js application
module.exports = {
    mqttClient,
    TOPICS,
    // Expose the OTA trigger so a backend admin route can call it
    triggerOTAUpdate: (url) => triggerOTAUpdate(mqttClient, url)
};
