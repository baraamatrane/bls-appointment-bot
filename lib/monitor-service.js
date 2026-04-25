import crypto from "crypto";
import { readConfig } from "./monitor-config";

const SLOT_AVAILABLE_KEYWORDS = [
  "select date",
  "choisir une date",
  "seleccionar fecha",
  "available",
  "disponible",
  "book now",
  "reserver",
  "book appointment",
];

const SLOT_UNAVAILABLE_KEYWORDS = [
  "no appointment",
  "aucun rendez-vous",
  "no hay cita",
  "no slots",
  "fully booked",
  "complet",
];

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
};

function nowIso() {
  return new Date().toISOString();
}

function formatTelegramTimestamp(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function buildTelegramMessage(config, title, message) {
  return [
    `🇪🇸 ${title}`,
    "",
    message,
    "",
    `🕒 ${formatTelegramTimestamp()}`,
    `🔗 Book NOW → ${config.bookingUrl}`,
  ].join("\n");
}

function redactConfig(config) {
  return {
    ...config,
    botToken: config.botToken ? `${config.botToken.slice(0, 6)}...` : "",
  };
}

class MonitorService {
  constructor() {
    this.reset();
  }

  reset() {
    this.running = false;
    this.timer = null;
    this.lastPageHash = null;
    this.slotsWereAvailable = false;
    this.lastCheckAt = null;
    this.lastChangeAt = null;
    this.lastResult = "idle";
    this.lastError = "";
    this.logs = [];
  }

  addLog(level, message) {
    this.logs.unshift({
      level,
      message,
      timestamp: nowIso(),
    });
    this.logs = this.logs.slice(0, 50);
  }

  getStatus() {
    const config = readConfig();
    return {
      running: this.running,
      lastCheckAt: this.lastCheckAt,
      lastChangeAt: this.lastChangeAt,
      lastResult: this.lastResult,
      lastError: this.lastError,
      slotsWereAvailable: this.slotsWereAvailable,
      config: redactConfig(config),
      logs: this.logs,
    };
  }

  async validateTelegram(config) {
    const botResponse = await fetch(
      `${config.telegramApiBaseUrl}/bot${config.botToken}/getMe`,
      { signal: AbortSignal.timeout(5000) },
    );
    const botData = await botResponse.json();
    if (!botResponse.ok || !botData.ok) {
      throw new Error("Invalid bot token. Could not verify with Telegram.");
    }

    const sendResponse = await fetch(
      `${config.telegramApiBaseUrl}/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.telegramId,
          text: buildTelegramMessage(
            config,
            "Monitor Started",
            "Your BLS Spain appointment monitor is now running. You will be notified the moment slots become available.",
          ),
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const sendData = await sendResponse.json();
    if (!sendResponse.ok || !sendData.ok) {
      throw new Error(
        "Telegram ID is invalid or the bot cannot message it yet. Send a message to your bot first, then try again.",
      );
    }
  }

  async sendTelegram(title, message) {
    const config = readConfig();
    if (!config.botToken || !config.telegramId) {
      this.addLog("warn", "Telegram is not configured.");
      return false;
    }

    try {
      const response = await fetch(
        `${config.telegramApiBaseUrl}/bot${config.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: config.telegramId,
            text: buildTelegramMessage(config, title, message),
          }),
          signal: AbortSignal.timeout(10000),
        },
      );

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error("Telegram rejected the message.");
      }

      this.addLog("info", `Telegram notification sent: ${title}`);
      return true;
    } catch (error) {
      this.lastError = error.message;
      this.addLog("error", `Telegram error: ${error.message}`);
      return false;
    }
  }

  hashPage(html) {
    return crypto.createHash("md5").update(html).digest("hex");
  }

  checkForSlots(html) {
    const hasAvailable = SLOT_AVAILABLE_KEYWORDS.some((keyword) =>
      html.includes(keyword),
    );
    const hasUnavailable = SLOT_UNAVAILABLE_KEYWORDS.some((keyword) =>
      html.includes(keyword),
    );

    return hasAvailable && !hasUnavailable;
  }

  async fetchPage() {
    const config = readConfig();
    const response = await fetch(config.bookingUrl, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch booking page: ${response.status}`);
    }

    return (await response.text()).toLowerCase();
  }

  scheduleNext(delayMs) {
    if (!this.running) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.runCheck().catch((error) => {
        this.lastError = error.message;
        this.addLog("error", `Monitor crash: ${error.message}`);
      });
    }, delayMs);
  }

  async runCheck() {
    if (!this.running) {
      return this.getStatus();
    }

    const config = readConfig();
    const delayMs = Math.max(5, Number(config.checkInterval || 30)) * 1000;

    try {
      const html = await this.fetchPage();
      const currentHash = this.hashPage(html);
      const slotsAvailable = this.checkForSlots(html);

      this.lastCheckAt = nowIso();
      this.lastError = "";

      if (slotsAvailable && !this.slotsWereAvailable) {
        this.slotsWereAvailable = true;
        this.lastChangeAt = this.lastCheckAt;
        this.lastResult = "slots_available";
        this.addLog("info", "Slots detected.");
        await this.sendTelegram(
          "Appointment slots available",
          "BLS Spain Casablanca booking slots have just opened. Check the site now.",
        );
      } else if (
        this.lastPageHash &&
        currentHash !== this.lastPageHash &&
        !slotsAvailable
      ) {
        this.lastChangeAt = this.lastCheckAt;
        this.lastResult = "page_changed";
        this.addLog("info", "Booking page changed.");
        await this.sendTelegram(
          "Page changed - check manually",
          "The BLS booking page content changed. Slots might be available.",
        );
      } else if (!slotsAvailable && this.slotsWereAvailable) {
        this.slotsWereAvailable = false;
        this.lastChangeAt = this.lastCheckAt;
        this.lastResult = "slots_closed";
        this.addLog("info", "Slots are no longer detected.");
      } else {
        this.lastResult = "no_change";
        this.addLog("info", "No slots yet.");
      }

      this.lastPageHash = currentHash;
    } catch (error) {
      this.lastCheckAt = nowIso();
      this.lastResult = "error";
      this.lastError = error.message;
      this.addLog("error", error.message);
    } finally {
      this.scheduleNext(delayMs);
    }

    return this.getStatus();
  }

  async start() {
    const config = readConfig();
    if (!config.botToken || !config.telegramId) {
      throw new Error("Save your Telegram bot token and Telegram ID first.");
    }

    if (this.running) {
      return this.getStatus();
    }

    this.running = true;
    this.lastResult = "starting";
    this.addLog("info", "Monitor started.");
    await this.sendTelegram(
      "Monitor Started",
      "Your BLS Spain appointment monitor is now running. You will be notified the moment slots become available.",
    );
    await this.runCheck();
    return this.getStatus();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.running = false;
    this.lastResult = "stopped";
    this.addLog("info", "Monitor stopped.");
    return this.getStatus();
  }

  async triggerCheck() {
    if (!this.running) {
      this.running = true;
      const status = await this.runCheck();
      this.running = false;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      return status;
    }

    return this.runCheck();
  }
}

function getMonitorSingleton() {
  if (!globalThis.__blsMonitorService) {
    globalThis.__blsMonitorService = new MonitorService();
  }

  return globalThis.__blsMonitorService;
}

export const monitorService = getMonitorSingleton();
