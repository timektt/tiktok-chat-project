function log(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${type}] ${timestamp} - ${message}`);
  }
  module.exports = { log };
  