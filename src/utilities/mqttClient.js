const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtts://12da1e12261a408dbe13547260faea0a.s1.eu.hivemq.cloud:8883';

function connectMQTT() {
    const client = mqtt.connect(BROKER_URL, {
        clientId: 'ctransit_backend_prod_01', 
        clean: false,                         
        
        username: process.env.MQTT_USERNAME || 'c-transit-server',
        password: process.env.MQTT_PASSWORD || 'B4c-Transitcuit4cu@2',
        
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
    });

    client.on('connect', () => {
        console.log(`Connected to MQTT broker at ${BROKER_URL} with persistent session.`);
    });

    client.on('error', (err) => {
        console.error('MQTT Connection Error:', err);
    });

    return client;
}

module.exports = { connectMQTT };
