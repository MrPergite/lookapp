// config/env.js
const fs = require("fs");
const path = require("path");

// Determine which environment to use
const ENVFILE = process.env.ENVFILE || ".env.production";

// Load the env file
const envPath = path.resolve(__dirname, "../config", ENVFILE);
const envConfig = require("dotenv").config({ path: envPath });

console.log({ ENVFILE, envPath, envConfig });

// Export the env values
module.exports = { ...envConfig.parsed, ENV: ENVFILE };
