import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    const body = await request.json();
    const botToken = body.botToken?.trim();
    const chatId = body.chatId?.trim() || body.telegramId?.trim();

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ error: "Bot token and Telegram ID are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const envPath = path.join(process.cwd(), "..", "backend", ".env");

    try {
      const botResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        { signal: AbortSignal.timeout(5000) },
      );

      const botData = await botResponse.json();
      if (!botResponse.ok || !botData.ok) {
        return new Response(
          JSON.stringify({
            error: "Invalid bot token. Could not verify with Telegram.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const testMessage = encodeURIComponent(
        "BLS Monitor connected successfully. You will receive alerts here.",
      );
      const sendResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${encodeURIComponent(chatId)}&text=${testMessage}`,
        { signal: AbortSignal.timeout(5000) },
      );
      const sendData = await sendResponse.json();

      if (!sendResponse.ok || !sendData.ok) {
        return new Response(
          JSON.stringify({
            error:
              "Telegram ID is invalid or the bot cannot message it yet. Send a message to your bot first, then try again.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch (telegramError) {
      return new Response(
        JSON.stringify({
          error:
            "Could not verify Telegram credentials. Check your internet connection and try again.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    let envLines = [
      `TELEGRAM_BOT_TOKEN=${botToken}`,
      `TELEGRAM_CHAT_ID=${chatId}`,
    ];

    if (fs.existsSync(envPath)) {
      const existingContent = fs.readFileSync(envPath, "utf8");
      const preservedLines = existingContent
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim() !== "" &&
            !line.startsWith("TELEGRAM_BOT_TOKEN=") &&
            !line.startsWith("TELEGRAM_CHAT_ID="),
        );

      envLines = [...envLines, ...preservedLines];
    } else {
      envLines.push("CHECK_INTERVAL=30");
    }

    fs.writeFileSync(envPath, `${envLines.join("\n")}\n`, "utf8");

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Configuration saved successfully. A Telegram test message was sent.",
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
