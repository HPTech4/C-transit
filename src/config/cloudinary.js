"use strict";

import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
import logger from "./logger.js";

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

// Test Cloudinary connection on startup
const testCloudinaryConnection = async () => {
    try {
        await cloudinary.api.ping();

        logger.info( {cloudName: env.cloudinary.cloudName }, "cloudinary.connection_successful");
        return true;
    } catch (error) {
        logger.error({ err: error.message }, "cloudinary.connection_failed");
        process.exit(1); // Exit if Cloudinary is not reachable
        return false;
    }
};

export default cloudinary;
