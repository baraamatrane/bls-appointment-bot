# BLS Monitor UI

A Next.js web application for configuring Telegram notifications for the BLS Spain Appointment Monitor.

## Features

- User-friendly form interface for Telegram setup
- Real-time validation of Telegram credentials
- Automatic saving to `.env` file
- Responsive design with modern UI
- Step-by-step guide for getting Telegram credentials

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Get Telegram Credentials:**
   - Open Telegram and search for @BotFather
   - Send `/newbot` command
   - Create your bot and copy the BOT_TOKEN
   - Send any message to your new bot
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Copy your chat ID from the response

2. **Configure in UI:**
   - Paste your Bot Token in the first field
   - Paste your Chat ID in the second field
   - Click "Save Configuration"
   - The credentials will be saved to the main monitor's `.env` file

## Building for Production

```bash
npm run build
npm start
```

## File Structure

```
├── app/
│   ├── api/
│   │   └── config/
│   │       └── route.js          # API endpoint for saving credentials
│   ├── layout.jsx                # Root layout
│   ├── page.jsx                  # Main form page
│   └── globals.css               # Global styles
├── package.json
├── next.config.js
└── README.md
```

## How It Works

1. User enters Telegram Bot Token and Chat ID
2. Form is submitted to `/api/config` endpoint
3. Backend validates the bot token with Telegram API
4. Configuration is saved to `../bls_monitor/.env`
5. Python monitor script picks up the new credentials
6. User receives Telegram notifications for appointment slots

## Environment Variables

The application writes the following variables to the parent BLS monitor's `.env` file:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID
- `CHECK_INTERVAL`: Default is 30 seconds

## Deployment

This app can be deployed to:

- Vercel (recommended for Next.js)
- Netlify
- Any Node.js hosting platform

## Troubleshooting

**Invalid bot token error:**

- Check that you copied the token correctly from @BotFather
- Ensure you have internet connectivity
- Verify the bot is active

**Chat ID not found:**

- Make sure you sent a message to your new bot
- Visit the getUpdates URL and check the response format

## License

MIT
