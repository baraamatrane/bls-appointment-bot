import { saveConfig } from "../../../lib/monitor-config";
import { monitorService } from "../../../lib/monitor-service";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(monitorService.getStatus().config);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const botToken = body.botToken?.trim() || "";
    const telegramId = body.chatId?.trim() || body.telegramId?.trim() || "";
    const checkInterval = Math.max(5, Number(body.checkInterval || 30));

    if (!botToken || !telegramId) {
      return Response.json(
        { error: "Bot token and Telegram ID are required" },
        { status: 400 },
      );
    }

    const nextConfig = {
      botToken,
      telegramId,
      checkInterval,
      telegramApiBaseUrl:
        process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org",
    };

    try {
      await monitorService.validateTelegram(nextConfig);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    saveConfig(nextConfig);

    return Response.json({
      success: true,
      message:
        "Configuration saved successfully. A Telegram test message was sent.",
      config: monitorService.getStatus().config,
    });
  } catch (error) {
    return Response.json(
      { error: `Failed to save configuration: ${error.message}` },
      { status: 500 },
    );
  }
}
