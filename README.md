# BLS Monitor UI

This is now a full-stack Next.js application. The same app provides the UI, stores monitor configuration, runs the polling loop, and sends Telegram notifications.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main flows

- Save Telegram bot token and Telegram ID from the dashboard
- Start or stop the monitor from the dashboard
- Run a manual check without leaving the page
- Watch recent server-side activity in the activity log

## Storage

Monitor settings are stored in `data/monitor-config.json`. This file is ignored by git.

## Server routes

- `GET /api/config`: read current saved config
- `POST /api/config`: validate and save Telegram credentials
- `GET /api/monitor`: read monitor state and recent logs
- `POST /api/monitor`: start, stop, or manually trigger the monitor

## Stress testing

Use the local mock Telegram API so the stress test does not hit the real Telegram service.

1. Start the mock Telegram server:

```bash
npm run mock:telegram
```

2. Start the Next.js app with the mock API base URL:

```bash
$env:TELEGRAM_API_BASE_URL="http://127.0.0.1:4010"
npm run dev
```

3. Run the stress test in another terminal:

```bash
npm run stress:test
```

By default this stresses `POST /api/config`, which is the safest write-heavy path to hammer locally. You can also target `GET /api/monitor`:

```bash
$env:STRESS_PROFILE="monitor-status"
npm run stress:test
```

Optional environment variables:

- `STRESS_PROFILE`: `config` or `monitor-status`, defaults to `config`
- `STRESS_TARGET_URL`: overrides the default URL for the selected profile
- `STRESS_REQUESTS`: defaults to `100`
- `STRESS_CONCURRENCY`: defaults to `20`
- `STRESS_MAX_FAILURES`: defaults to `0`
- `STRESS_BOT_TOKEN`: defaults to `stress-test-token` for the `config` profile
- `STRESS_TELEGRAM_ID`: defaults to `123456789` for the `config` profile
- `STRESS_CHECK_INTERVAL`: defaults to `30` for the `config` profile

## Deployment note

The monitor uses an in-process loop, so deploy it to a persistent Node.js runtime rather than a serverless-only environment.
