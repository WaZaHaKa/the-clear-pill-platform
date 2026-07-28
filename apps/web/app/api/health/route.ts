import { db } from "@clearpill/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok", service: "clear-pill-web" });
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        database: "error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
