import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    const { botToken, chatId } = await request.json();

    // Validate inputs
    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ error: "Bot token and chat ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create .env file in parent directory
    const envPath = path.join(process.cwd(), "..", "bls_monitor", ".env");

    let envContent = `TELEGRAM_BOT_TOKEN=${botToken}\nTELEGRAM_CHAT_ID=${chatId}\nCHECK_INTERVAL=30\n`;

    // Check if .env exists and preserve other variables
    if (fs.existsSync(envPath)) {
      const existingContent = fs.readFileSync(envPath, "utf8");
      const lines = existingContent.split("\n");
      const preservedLines = lines.filter(
        (line) =>
          !line.startsWith("TELEGRAM_BOT_TOKEN=") &&
          !line.startsWith("TELEGRAM_CHAT_ID=") &&
          line.trim() !== "",
      );
      envContent = `TELEGRAM_BOT_TOKEN=${botToken}\nTELEGRAM_CHAT_ID=${chatId}\n${preservedLines.join("\n")}`;
    }

    fs.writeFileSync(envPath, envContent);

    // Test Telegram connection
    try {
      const testResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        { timeout: 5000 },
      );

      if (!testResponse.ok) {
        return new Response(
          JSON.stringify({
            error: "Invalid bot token. Could not verify with Telegram.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch (telegramError) {
      return new Response(
        JSON.stringify({
          error:
            "Could not verify bot token with Telegram. Check your internet connection.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Configuration saved successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error saving configuration:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save configuration: " + error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
