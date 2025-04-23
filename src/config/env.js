// 📁 src/config/env.js
require("dotenv").config();

module.exports = {
  username: process.env.TIKTOK_USERNAME,
  webhookUrl: process.env.N8N_WEBHOOK_URL,
};
