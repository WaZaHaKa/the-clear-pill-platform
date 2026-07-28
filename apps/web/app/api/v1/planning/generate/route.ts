import { generateDailyMissions } from "@clearpill/planning-service";

export async function POST(request: Request): Promise<Response> {
  if (process.env.DEMO_MODE !== "true") {
    return Response.json({ error: "Authentication is not configured" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      userId?: string;
      dateKey?: string;
    };
    if (!body.workspaceId || !body.userId || !body.dateKey) {
      return Response.json({ error: "workspaceId, userId and dateKey are required" }, { status: 400 });
    }
    const result = await generateDailyMissions({
      workspaceId: body.workspaceId,
      userId: body.userId,
      dateKey: body.dateKey,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
