import http from "http";
import { URL } from "url";

const port = Number(process.env.MOCK_TELEGRAM_PORT || 4010);
const responseDelayMs = Number(process.env.MOCK_TELEGRAM_DELAY_MS || 25);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const match = path.match(/^\/bot([^/]+)\/(getMe|sendMessage)$/);

  if (!match) {
    sendJson(res, 404, { ok: false, description: "Not found" });
    return;
  }

  const [, token, method] = match;
  const chatId = url.searchParams.get("chat_id");

  setTimeout(() => {
    if (token === "bad-token") {
      sendJson(res, 401, { ok: false, description: "Unauthorized" });
      return;
    }

    if (method === "getMe") {
      sendJson(res, 200, {
        ok: true,
        result: {
          id: 123456789,
          is_bot: true,
          first_name: "MockBLSBot",
          username: "mock_bls_bot",
        },
      });
      return;
    }

    if (!chatId || chatId === "blocked") {
      sendJson(res, 400, {
        ok: false,
        description: "Bad Request: chat not found",
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      result: {
        message_id: Date.now(),
        chat: { id: chatId, type: "private" },
      },
    });
  }, responseDelayMs);
});

server.listen(port, () => {
  console.log(`Mock Telegram API listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
