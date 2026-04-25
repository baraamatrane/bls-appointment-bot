# BLS Spain Casablanca Appointment Monitor

This Python script automatically monitors the BLS Spain Casablanca booking page for available appointment slots and sends instant notifications via Telegram when slots open.

## Features

- Real-time monitoring of appointment availability
- Telegram notifications when slots become available
- Configurable check intervals
- Logging for monitoring activity

## Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Configure `.env` file with your Telegram bot token and chat ID
3. Run the monitor: `python monitor.py`

## Configuration

- Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env`
- Adjust `CHECK_INTERVAL` in the script for monitoring frequency (default: 30 seconds)

## Usage

Run `python monitor.py` and leave it running. You'll receive Telegram notifications when appointment slots become available.

### Option A — Free cloud: [Railway.app](https://railway.app)

1. Push this folder to a GitHub repo
2. Connect repo to Railway → Deploy
3. Add your `.env` variables in Railway's dashboard
4. Free tier runs continuously

### Option B — Free cloud: [Render.com](https://render.com)

1. New → Background Worker
2. Connect GitHub repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `python monitor.py`

### Option C — Your PC (simplest)

Just run `python monitor.py` in a terminal and keep it open.
On Windows, you can also set it as a scheduled task.

### Option D — VPS (most reliable)

```bash
# On any Linux VPS (Ubuntu)
nohup python monitor.py &
# Or with systemd for auto-restart on crash
```

---

## 📁 Files

| File               | Purpose                          |
| ------------------ | -------------------------------- |
| `monitor.py`       | Main bot script                  |
| `.env.example`     | Config template → copy to `.env` |
| `requirements.txt` | Python dependencies              |
| `monitor.log`      | Auto-created log file            |

---

## ⚠️ Notes

- This is for **personal use only** — do not run multiple instances or very fast intervals as it may get your IP blocked.
- The script detects slot availability based on page content keywords. If BLS changes their page layout, you may need to update `SLOT_AVAILABLE_KEYWORDS` in `monitor.py`.
- BLS requires login to actually book — when you get the notification, **go to the site immediately** as slots fill within minutes.
