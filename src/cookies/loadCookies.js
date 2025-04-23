const fs = require("fs");
const path = require("path");

function loadCookies() {
  const cookiesPath = path.resolve(__dirname, "../../cookies.json");
  if (!fs.existsSync(cookiesPath)) {
    console.error("❌ cookies.json not found at", cookiesPath);
    process.exit(1);
  }

  const rawCookies = fs.readFileSync(cookiesPath, "utf-8");
  const parsed = JSON.parse(rawCookies);

  const cleaned = parsed.map(cookie => {
    if (!cookie.sameSite || typeof cookie.sameSite !== "string") {
      delete cookie.sameSite;
    }
    return cookie;
  });

  return cleaned;
}

module.exports = loadCookies;
