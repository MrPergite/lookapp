// config/env.js
const fs = require("fs");
const path = require("path");

// Determine which environment to use
const ENV = process.env.ENV || "production";

// Load the env file
const envPath = path.resolve(__dirname, "../config", `.env.${ENV}`);
const envConfig = require("dotenv").config({ path: envPath });

console.log("Running on Environment: ", envPath);

// Export the env values
module.exports = { ...envConfig.parsed, ENV: `.env.${ENV}` };
