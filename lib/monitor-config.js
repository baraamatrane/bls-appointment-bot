import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "monitor-config.json");

const DEFAULT_CONFIG = {
  botToken: "",
  telegramId: "",
  checkInterval: 30,
  bookingUrl: "https://www.blsspainmorocco.net/MAR/account/login",
  telegramApiBaseUrl: process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org",
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

export function readConfig() {
  ensureDataDir();

  if (!fs.existsSync(CONFIG_PATH)) {
    return getDefaultConfig();
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      checkInterval: Number(parsed.checkInterval || DEFAULT_CONFIG.checkInterval),
    };
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(partialConfig) {
  ensureDataDir();
  const existing = readConfig();
  const nextConfig = {
    ...existing,
    ...partialConfig,
    checkInterval: Number(partialConfig.checkInterval || existing.checkInterval),
  };

  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");
  return nextConfig;
}

export function getConfigPath() {
  return CONFIG_PATH;
}
