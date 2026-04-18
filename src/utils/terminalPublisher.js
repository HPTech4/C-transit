// terminalPublisher.js

function triggerOTAUpdate(client, firmwareUrl) {
    const topic = 'ctransit/terminals/cmd/update'; 
    
    
    client.publish(topic, firmwareUrl, { qos: 1 }, (err) => {
        if (err) {
            console.error(`Failed to publish OTA command to ${topic}:`, err);
        } else {
            console.log(`Published OTA trigger to ${topic} with URL: ${firmwareUrl}`);
        }
    });
}

module.exports = { triggerOTAUpdate };
