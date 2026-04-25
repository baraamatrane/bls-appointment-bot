"use client";

import { useEffect, useRef, useState } from "react";

const initialStatus = {
  running: false,
  lastCheckAt: null,
  lastChangeAt: null,
  lastResult: "idle",
  lastError: "",
  config: {
    botToken: "",
    telegramId: "",
    checkInterval: 30,
  },
  logs: [],
};

function formatResultLabel(value) {
  if (!value) {
    return "Idle";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Home() {
  const [botToken, setBotToken] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);
  const [monitorAction, setMonitorAction] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [monitorStatus, setMonitorStatus] = useState(initialStatus);
  const hasLoadedInitialConfig = useRef(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch("/api/monitor", { cache: "no-store" });
        const data = await response.json();
        setMonitorStatus(data);

        if (!hasLoadedInitialConfig.current) {
          setTelegramId(data.config.telegramId || "");
          hasLoadedInitialConfig.current = true;
        }
      } catch (error) {
        setStatus({
          type: "error",
          message: "Could not load monitor status.",
        });
      }
    };

    loadStatus();
    const intervalId = setInterval(loadStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!botToken.trim() || !telegramId.trim()) {
      setStatus({
        type: "error",
        message: "Please fill in the bot token and Telegram ID.",
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
          botToken,
          telegramId,
          checkInterval: monitorStatus.config.checkInterval || 30,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save configuration.");
      }

      setMonitorStatus((current) => ({
        ...current,
        config: data.config,
      }));
      setStatus({
        type: "success",
        message: data.message,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMonitorAction = async (action) => {
    setMonitorAction(action);
    setStatus({
      type: "loading",
      message:
        action === "check"
          ? "Running a manual check..."
          : `${action === "start" ? "Starting" : "Stopping"} monitor...`,
    });

    try {
      const response = await fetch("/api/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Monitor action failed.");
      }

      setMonitorStatus(data);
      setStatus({
        type: "success",
        message:
          action === "start"
            ? "Monitor started."
            : action === "stop"
              ? "Monitor stopped."
              : "Manual check completed.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setMonitorAction("");
    }
  };

  return (
    <main>
      {status.message && (
        <div className={`status show top-status ${status.type}`}>
          {status.message}
        </div>
      )}

      {monitorStatus.lastError && (
        <div className="status show top-status error">
          {monitorStatus.lastError}
        </div>
      )}

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">BLS monitor dashboard</span>
          <h1>BLS Appointment Monitor</h1>
          <p>
            A quiet control panel for Telegram alerts, monitor status, and
            recent booking checks.
          </p>
        </div>

        <div className="status-pill">
          <span
            className={`dot ${monitorStatus.running ? "live" : "idle"}`}
          />
          {monitorStatus.running ? "Running" : "Stopped"}
        </div>
      </section>

      <section className="layout">
        <form className="panel" onSubmit={handleSave}>
          <div className="panel-head">
            <h2>Telegram Setup</h2>
            <p>Save the credentials the Next.js monitor will use.</p>
          </div>

          <div className="guide">
            <h3>How to get your Telegram token and ID</h3>
            <ol>
              <li>Open Telegram and search for <strong>@BotFather</strong></li>
              <li>Send <code>/newbot</code> and follow the steps</li>
              <li>Copy the bot token</li>
              <li>Send any message to your bot</li>
              <li>
                Open{" "}
                <code>https://api.telegram.org/bot&lt;YOUR_TOKEN&gt;/getUpdates</code>
              </li>
              <li>Copy your chat or user ID from the response</li>
            </ol>
          </div>

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
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Monitor Control</h2>
              <p>Start the poller, stop it, or run a manual check.</p>
            </div>

            <div className="actions">
              <button
                type="button"
                className="secondary"
                disabled={monitorAction !== "" || monitorStatus.running}
                onClick={() => handleMonitorAction("start")}
              >
                {monitorAction === "start" ? "Starting..." : "Start Monitor"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={monitorAction !== "" || !monitorStatus.running}
                onClick={() => handleMonitorAction("stop")}
              >
                {monitorAction === "stop" ? "Stopping..." : "Stop Monitor"}
              </button>
              <button
                type="button"
                className="ghost"
                disabled={monitorAction !== ""}
                onClick={() => handleMonitorAction("check")}
              >
                {monitorAction === "check" ? "Checking..." : "Check Now"}
              </button>
            </div>

            <div className="stats">
              <div>
                <span>Last result</span>
                <strong>{formatResultLabel(monitorStatus.lastResult)}</strong>
              </div>
              <div>
                <span>Last check</span>
                <strong>{monitorStatus.lastCheckAt || "Not yet"}</strong>
              </div>
              <div>
                <span>Last change</span>
                <strong>{monitorStatus.lastChangeAt || "None"}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
