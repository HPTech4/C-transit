const mqtt = require('mqtt');

// 1. THE FIX: Define the Persistent Session rules BEFORE connecting
// Note: On a public broker, your clientId must be highly unique so it doesn't collide with other users.
const connectOptions = {
    clientId: 'ctransit_backend_sim_destiny_001', // Rule 1: Static, unique ID
    clean: false,                                 // Rule 2: Tells broker to queue offline messages
    reconnectPeriod: 5000                         // Auto-reconnect every 5 seconds if dropped
};

// 2. Connect to the PUBLIC HiveMQ broker using the Persistent Session options
const brokerUrl = 'mqtt://broker.hivemq.com:1883';
const client = mqtt.connect(brokerUrl, connectOptions);

// 3. Make the topic unique for the public test
const topic = 'ctransit/tx/test_queue_v1';

// 4. What to do when the connection is successful
client.on('connect', () => {
    console.log(`✅ Connected to MQTT Broker at ${brokerUrl} with Persistent Session`);
    
    // Subscribe to the topic with QoS 1 to ensure delivery
    client.subscribe(topic, { qos: 1 }, (err) => {
        if (!err) {
            console.log(`📡 Listening for offline transactions on: ${topic}`);
            console.log(`⏳ Waiting for hardware to sync...`);
            console.log(`💡 TEST ME: Stop this script, send a payload from your ESP32, then restart this script!`);
        } else {
            console.error(`❌ Subscription error:`, err);
        }
    });
});

// 5. What to do when a message arrives
client.on('message', (topic, message) => {
    // The message arrives as a raw data buffer; convert it to a readable string
    const payload = message.toString();
    
    console.log(`\n📥 New Sync Event Detected on [${topic}]:`);
    console.log(`   Raw Payload: ${payload}`);
    
    // Quick visual parsing to demonstrate to the team how CSV splits easily
    const records = payload.split('|');
    console.log(`   Successfully parsed ${records.length} transaction(s):`);
    
    records.forEach((record, index) => {
        // Expected format: TerminalID,UID,Amount,Timestamp 
        const [terminalId, uid, amount, timestamp] = record.split(',');
        console.log(`      ${index + 1}. Terminal: ${terminalId} | Card UID: ${uid} | Amount: ${amount} | Time: ${timestamp}`);
    });
});
