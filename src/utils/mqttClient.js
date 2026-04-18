import mqtt from "mqtt";
import 'dotenv/config';

function connectMQTT() {
  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 1000,
  });

  client.on("connect", () => {
    console.log("MQTT Connected");
  });

  client.on("error", console.error);

  return client;
}

export { connectMQTT };
