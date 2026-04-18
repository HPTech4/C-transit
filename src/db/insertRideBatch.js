import prisma from "../lib/prisma.js";

async function insertRideBatch(rides) {
  if (!rides || rides.length === 0) return;

  const values = [];
  const placeholders = [];

  rides.forEach((ride, i) => {
    const base = i * 6;

    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
        base + 5
      }, $${base + 6})`
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
        VALUES ${placeholders.join(",")}
        ON CONFLICT (transaction_id) DO NOTHING
    `;

  await prisma.$executeRawUnsafe(query, ...values);

  console.log("Insert successful");
}

export { insertRideBatch };
