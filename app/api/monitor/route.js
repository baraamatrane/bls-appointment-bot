import { monitorService } from "../../../lib/monitor-service";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(monitorService.getStatus());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "start") {
      return Response.json(await monitorService.start());
    }

    if (action === "stop") {
      return Response.json(monitorService.stop());
    }

    if (action === "check") {
      return Response.json(await monitorService.triggerCheck());
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
