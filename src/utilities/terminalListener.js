const { parseCSVLogs } = require('./logParser');
const { forwardToBackend } = require('./backendForwarder');

const TOPIC_TX_FLUSH = 'ctransit/tx/flush';

function setupTerminalListener(client) {
    
    client.subscribe(TOPIC_TX_FLUSH, { qos: 1 }, (err) => {
        if (err) {
            console.error(`Failed to subscribe to ${TOPIC_TX_FLUSH}`, err);
        } else {
            console.log(`Subscribed to ${TOPIC_TX_FLUSH} (QoS 1)`);
        }
    });

    client.on('message', async (topic, message) => {
        if (topic === TOPIC_TX_FLUSH) {
            try {
                const payloadString = message.toString();
                const parsedBatch = parseCSVLogs(payloadString);
                
                if (parsedBatch.length > 0) {
                    await forwardToBackend(parsedBatch);
                }
            } catch (error) {
                console.error('Error processing incoming flush payload:', error);
            }
        }
    });
}

module.exports = { setupTerminalListener, TOPIC_TX_FLUSH };
