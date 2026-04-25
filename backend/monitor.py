#!/usr/bin/env python3
"""
BLS Spain Casablanca - Appointment Slot Monitor
Checks the booking page every N seconds and notifies via Telegram + Email when slots appear.

SETUP:
  pip install requests python-dotenv
  Copy .env.example to .env and fill in your credentials.
  Run: python monitor.py
"""

import os
import time
import hashlib
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ─── CONFIG ───────────────────────────────────────────────────────────────────

BOOKING_URL = "https://www.blsspainmorocco.net/MAR/account/login"

# How often to check (in seconds). 30s is safe; lower risks IP block.
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "30"))

# Keywords that indicate slots ARE available (adjust if needed)
SLOT_AVAILABLE_KEYWORDS = [
    "select date",
    "choisir une date",
    "seleccionar fecha",
    "available",
    "disponible",
    "book now",
    "réserver",
    "book appointment",
]

# Keywords that indicate NO slots (page shown when full)
SLOT_UNAVAILABLE_KEYWORDS = [
    "no appointment",
    "aucun rendez-vous",
    "no hay cita",
    "no slots",
    "fully booked",
    "complet",
]

# Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID", "")

# ─── LOGGING ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("monitor.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

def send_telegram(message: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        log.warning("Telegram not configured — skipping.")
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
    }
    try:
        r = requests.post(url, json=payload, timeout=10)
        r.raise_for_status()
        log.info("✅ Telegram notification sent.")
        return True
    except Exception as e:
        log.error(f"Telegram error: {e}")
        return False


def notify(title: str, message: str):
    """Fire Telegram alert."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    tg_msg = (
        f"🇪🇸 <b>{title}</b>\n\n"
        f"{message}\n\n"
        f"🕒 {now}\n"
        f'🔗 <a href="{BOOKING_URL}">Book NOW →</a>'
    )
    send_telegram(tg_msg)

# ─── MONITORING LOGIC ─────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}

last_page_hash = None
slots_were_available = False


def fetch_page() -> str | None:
    try:
        r = requests.get(BOOKING_URL, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.text.lower()
    except Exception as e:
        log.warning(f"Fetch failed: {e}")
        return None


def check_for_slots(html: str) -> bool:
    """Return True if the page seems to have available slots."""
    has_available = any(kw in html for kw in SLOT_AVAILABLE_KEYWORDS)
    has_unavailable = any(kw in html for kw in SLOT_UNAVAILABLE_KEYWORDS)

    if has_available and not has_unavailable:
        return True
    # Fallback: detect if the page content changed significantly
    return False


def page_hash(html: str) -> str:
    return hashlib.md5(html.encode()).hexdigest()


def run():
    global last_page_hash, slots_were_available

    log.info("=" * 55)
    log.info("  BLS Spain Casablanca - Appointment Monitor Started")
    log.info(f"  Checking every {CHECK_INTERVAL}s → {BOOKING_URL}")
    log.info("=" * 55)

    # Send startup ping
    notify(
        "Monitor Started",
        "Your BLS Spain appointment monitor is now running. "
        "You will be notified the moment slots become available."
    )

    while True:
        html = fetch_page()
        if html is None:
            log.info(f"⏳ Retrying in {CHECK_INTERVAL}s...")
            time.sleep(CHECK_INTERVAL)
            continue

        current_hash = page_hash(html)
        slots_available = check_for_slots(html)

        # Detect state change: unavailable → available
        if slots_available and not slots_were_available:
            log.info("🚨 SLOTS DETECTED! Firing notifications...")
            notify(
                "Appointment Slots Available!",
                "BLS Spain Casablanca booking slots have just opened. "
                "Go book your appointment immediately before they fill up!"
            )
            slots_were_available = True

        # Detect page content change even if keywords not matched
        elif current_hash != last_page_hash and last_page_hash is not None:
            log.info("📄 Page changed — check manually.")
            notify(
                "Page Changed — Check Manually",
                "The BLS booking page content changed. "
                "Slots might be available — please check now!"
            )

        # Slots went away
        elif not slots_available and slots_were_available:
            log.info("😔 Slots no longer detected.")
            slots_were_available = False

        else:
            log.info(f"⏳ No slots yet. Checking again in {CHECK_INTERVAL}s...")

        last_page_hash = current_hash
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    run()
