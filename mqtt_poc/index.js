const mqtt = require('mqtt');

// 1. Connect to the local Mosquitto broker
const client = mqtt.connect('mqtt://localhost:1883');

// 2. Define the topic for offline transaction flushing 
const topic = 'ctransit/tx/flush';

// 3. What to do when the connection is successful
client.on('connect', () => {
    console.log(`✅ Connected to MQTT Broker at localhost:1883`);
    
    // Subscribe to the topic with QoS 1 to ensure delivery [cite: 94]
    client.subscribe(topic, { qos: 1 }, (err) => {
        if (!err) {
            console.log(`📡 Listening for offline transactions on: ${topic}`);
            console.log(`⏳ Waiting for hardware to sync...`);
        } else {
            console.error(`❌ Subscription error:`, err);
        }
    });
});

// 4. What to do when a message arrives
client.on('message', (topic, message) => {
    // The message arrives as a raw data buffer; convert it to a readable string
    const payload = message.toString();
    
    console.log(`\n📥 New Sync Event Detected on [${topic}]:`);
    console.log(`   Raw Payload: ${payload}`);
    
    // Quick visual parsing to demonstrate to the team how CSV splits easily [cite: 95]
    const records = payload.split('|');
    console.log(`   Successfully parsed ${records.length} transaction(s):`);
    
    records.forEach((record, index) => {
        // Expected format: TerminalID,UID,Amount,Timestamp 
        const [terminalId, uid, amount, timestamp] = record.split(',');
        console.log(`      ${index + 1}. Terminal: ${terminalId} | Card UID: ${uid} | Amount: ${amount} | Time: ${timestamp}`);
    });
});
