// File: src/utils/websocketInterceptor.js

function interceptWebSocket(webhookUrl) {
    const connectedAt = Date.now();
    const OriginalWebSocket = window.WebSocket;
  
    window.WebSocket = function (url, protocols) {
      const ws = new OriginalWebSocket(url, protocols);
  
      ws.addEventListener("message", (event) => {
        try {
          const handleRawData = (binary) => {
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
            } catch (err) {
              console.log("⚠️ Inflate or Parse error:", err.message);
            }
          };
  
          if (event.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = () => handleRawData(reader.result);
            reader.readAsArrayBuffer(event.data);
          } else if (event.data instanceof ArrayBuffer) {
            handleRawData(event.data);
          } else {
            console.log("⚠️ Unknown WebSocket message type:", typeof event.data);
          }
        } catch (err) {
          console.log("⚠️ WebSocket handler error:", err.message);
        }
      });
  
      return ws;
    };
  }
  
  export default interceptWebSocket;
  