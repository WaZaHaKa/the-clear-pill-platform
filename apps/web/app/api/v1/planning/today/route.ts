import { getTodayDashboard } from "@clearpill/planning-service";

export async function GET(request: Request): Promise<Response> {
  if (process.env.DEMO_MODE !== "true") {
    return Response.json({ error: "Authentication is not configured" }, { status: 403 });
  }
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const userId = url.searchParams.get("userId");
  const dateKey = url.searchParams.get("dateKey");
  if (!workspaceId || !userId || !dateKey) {
    return Response.json({ error: "workspaceId, userId and dateKey are required" }, { status: 400 });
  }
  return Response.json(await getTodayDashboard({ workspaceId, userId, dateKey }));
}
