import { parseCSVLogs } from "./logParser.js";
import { insertRideBatch } from "../db/insertRideBatch.js";

const TOPIC = "ctransit/tx/flush";

function setupTerminalListener(client) {
  client.subscribe(TOPIC, { qos: 1 });

  client.on("message", async (topic, message) => {
    if (topic !== TOPIC) return;

    try {
      const payload = message.toString();

      console.log("Incoming payload:", payload);

      const parsed = parseCSVLogs(payload);

      console.log("Parsed:", parsed);

      await insertRideBatch(parsed);
    } catch (err) {
      console.error("Processing error:", err);
    }
  });
}

export { setupTerminalListener };
