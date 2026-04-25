# BLS Appointment Monitor

A combined project with a Python backend that monitors BLS Spain Casablanca appointment availability and a Next.js frontend for configuring Telegram notification credentials.

## Project structure

- `backend/` - Python monitor script and dependencies
- `frontend/` - Next.js app for managing Telegram bot token and chat ID

## Features

- Monitor BLS appointment availability automatically
- Send Telegram notifications when slots open
- Configure Telegram credentials via a web UI
- Clean separation between monitoring logic and configuration UI

## Getting started

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file with:

```text
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>
CHECK_INTERVAL=30
```

Run the monitor:

```bash
python monitor.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and enter your Telegram bot token and chat ID.

## Notes

- The frontend saves configuration for the backend monitor.
- Make sure the Python backend can read the `.env` file after the frontend writes it.
- Use a reasonable `CHECK_INTERVAL` so you do not overload the service.

## Useful commands

- Start backend monitor: `cd backend && python monitor.py`
- Start frontend UI: `cd frontend && npm run dev`

## License

MIT
