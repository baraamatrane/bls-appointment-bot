"use client";

import { useState } from "react";

export default function Home() {
  const [botToken, setBotToken] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!botToken.trim() || !telegramId.trim()) {
      setStatus({
        type: "error",
        message: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "loading", message: "Saving configuration..." });

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botToken: botToken.trim(),
          telegramId: telegramId.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message:
            "Configuration saved. A test Telegram message was sent to confirm alerts will arrive.",
        });
        setBotToken("");
        setTelegramId("");
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to save configuration",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Error: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        <div className="header">
          <h1>BLS Monitor Setup</h1>
          <p>Configure your Telegram notifications</p>
        </div>

        <div className="guide">
          <h3>How to get your Telegram token and ID:</h3>
          <ol>
            <li>
              Open Telegram and search for <strong>@BotFather</strong>
            </li>
            <li>
              Send <code>/newbot</code> and follow the steps
            </li>
            <li>
              Copy your <strong>bot token</strong> from BotFather
            </li>
            <li>Send any message to your new bot</li>
            <li>
              Visit{" "}
              <code>https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getUpdates</code>
            </li>
            <li>
              Copy your <strong>chat or user ID</strong> from the response
            </li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="botToken">Telegram Bot Token</label>
            <input
              id="botToken"
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              disabled={loading}
            />
            <div className="input-hint">Keep this secret. From @BotFather</div>
          </div>

          <div className="form-group">
            <label htmlFor="telegramId">Telegram ID</label>
            <input
              id="telegramId"
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="123456789"
              disabled={loading}
            />
            <div className="input-hint">
              Your Telegram chat or user ID from getUpdates
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>

        {status.message && (
          <div className={`status show ${status.type}`}>{status.message}</div>
        )}
      </div>
    </main>
  );
}
