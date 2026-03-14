const prisma = require('../lib/prisma');

async function insertRideBatch(rides) {

    if (!rides || rides.length === 0) return;

    const values = [];
    const placeholders = [];

    rides.forEach((ride, index) => {

        const baseIndex = index * 6;

        placeholders.push(
            `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`
        );

        values.push(
            ride.transaction_id,
            ride.type,
            ride.amount,
            ride.terminal_id,
            new Date(ride.device_timestamp * 1000),
            ride.server_sync_time
        );

    });

    const query = `
        INSERT INTO "Transaction"
        (transaction_id, type, amount, terminal_id, device_timestamp, server_sync_time)
        VALUES
        ${placeholders.join(',')}
        ON CONFLICT (transaction_id) DO NOTHING
    `;

    await prisma.$executeRawUnsafe(query, ...values);
}

module.exports = { insertRideBatch };