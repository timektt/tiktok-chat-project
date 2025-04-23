// src/bots/puppeteerBot.js
require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { log } = require("../utils/logger");
const loadCookies = require("../cookies/loadCookies");

puppeteer.use(StealthPlugin());

const username = process.env.TIKTOK_USERNAME;
const webhookUrl = process.env.N8N_WEBHOOK_URL;

async function runPuppeteerBot() {
  const cookies = loadCookies();
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--window-size=1200,800",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
  await page.setCookie(...cookies);

  const liveUrl = `https://www.tiktok.com/@${username}/live`;
  log("START", `Opening TikTok Live: ${liveUrl}`);

  page.on("console", msg => {
    const text = msg.text();
    if (text.startsWith("💬") || text.startsWith("❌") || text.startsWith("⚠️")) {
      log("browser", text);
    }
  });

  await page.goto(liveUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

const path = require("path");
await page.addScriptTag({ path: path.resolve(__dirname, "../utils/pako.min.js") });


  const hasPako = await page.evaluate(() => typeof window.pako !== "undefined");
  if (!hasPako) {
    log("ERROR", "pako not loaded in browser context");
    await browser.close();
    process.exit(1);
  }

  await page.evaluate((webhookUrl) => {
    const connectedAt = Date.now();
    const OriginalWebSocket = window.WebSocket;

    window.WebSocket = function (url, protocols) {
      const ws = new OriginalWebSocket(url, protocols);

      ws.addEventListener("message", (event) => {
        const handleBinary = (binary) => {
          try {
            const text = window.pako.inflate(new Uint8Array(binary), { to: "string" });
            if (text.includes("WebcastChatMessage")) {
              const json = JSON.parse(text);
              const comment = json?.data?.event?.eventData?.comment?.text;
              const nickname = json?.data?.event?.eventData?.user?.nickname;
              const createTime = json?.data?.event?.eventData?.comment?.createTime;
              const createAtMs = createTime ? createTime * 1000 : Date.now();

              if (createAtMs >= connectedAt && comment && nickname) {
                console.log(`💬 ${nickname}: ${comment}`);
                fetch(webhookUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ user: nickname, text: comment }),
                }).catch(err => console.log("❌ Webhook error: " + err.message));
              }
            }
          } catch (e) {
            console.log("⚠️ Inflate or Parse error:", e.message);
          }
        };

        if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => handleBinary(reader.result);
          reader.readAsArrayBuffer(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          handleBinary(event.data);
        } else {
          console.log("⚠️ Unknown WebSocket message type:", typeof event.data);
        }
      });

      return ws;
    };
  }, webhookUrl);

  log("READY", "✅ WebSocket Hook injected. Waiting for new messages...");
}

module.exports = runPuppeteerBot;
