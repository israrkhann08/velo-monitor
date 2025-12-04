require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  VCO_URL: process.env.VCO_URL || "https://vco84-usvi1.velocloud.net",
  API_TOKEN: process.env.API_TOKEN || "your_token_here",
  ENTERPRISE_ID: Number(process.env.ENTERPRISE_ID || 0),
  TIMEOUT: Number(process.env.TIMEOUT_MS || 20000),
  MAX_WORKERS: Number(process.env.MAX_WORKERS || 4),
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || 30000),
  HISTORY_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
};