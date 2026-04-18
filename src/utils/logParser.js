import crypto from "crypto";

function parseCSVLogs(payload) {
  if (!payload) return [];

  const [terminal_id, batchData] = payload.split(":");
  if (!batchData) return [];

  const logs = batchData.split("|");

  return logs.map((entry) => {
    const [card_uid, amount, timestamp] = entry.split(",");

    const hash = crypto
      .createHash("sha256")
      .update(`${card_uid}${timestamp}${terminal_id}`)
      .digest("hex");

    return {
      transaction_id: hash,
      type: "Ride_Deduction",
      amount: parseInt(amount),
      terminal_id,
      device_timestamp: parseInt(timestamp),
      server_sync_time: new Date(),
    };
  });
}

export { parseCSVLogs };
