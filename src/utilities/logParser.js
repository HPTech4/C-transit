const crypto = require('crypto');

function parseCSVLogs(payloadString) {
    if (!payloadString) return [];

    const payloadParts = payloadString.split(':');
    
    if (payloadParts.length < 2) return [];

    const terminal_id = payloadParts[0];
    const batchData = payloadParts[1];

    // 2. Unpack the rides
    const logEntries = batchData.split('|');
    const parsedLogs = [];

    for (const entry of logEntries) {
        if (!entry.trim()) continue;

        // 3. Extract the 3 remaining fields
        const fields = entry.split(',');
        
        if (fields.length >= 3) {
            const card_uid = fields[0];
            const amount = parseInt(fields[1], 10);
            const device_timestamp = parseInt(fields[2], 10);

            // Create composite hash: card_uid + device_timestamp + terminal_id
            const hashString = `${card_uid}${device_timestamp}${terminal_id}`;
            const transaction_id = crypto.createHash('sha256').update(hashString).digest('hex');

            parsedLogs.push({
                transaction_id: transaction_id,
                type: "Ride_Deduction", 
                amount: amount,
                terminal_id: terminal_id, /
                device_timestamp: device_timestamp,
                server_sync_time: new Date() // ISODate
            });
        }
    }

    return parsedLogs;
}

module.exports = { parseCSVLogs };
