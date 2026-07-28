import { GenerationStatus, db } from "@clearpill/db";
import { MISSION_ALGORITHM_VERSION } from "@clearpill/planning-core";
import {
  dateKeyForTimeZone,
  generateDailyMissions,
  minuteOfDayForTimeZone,
} from "@clearpill/planning-service";

const pollSeconds = Math.max(15, Number(process.env.MISSION_WORKER_POLL_SECONDS ?? 60));
let stopping = false;
let running = false;

function log(level: "info" | "warn" | "error", event: string, payload: object = {}): void {
  console.log(JSON.stringify({ level, event, at: new Date().toISOString(), ...payload }));
}

async function runCycle(): Promise<void> {
  if (running || stopping) return;
  running = true;
  try {
    const memberships = await db.workspaceMember.findMany({
      where: { isActive: true, workspace: { isActive: true } },
      include: { workspace: true, user: true },
    });

    for (const membership of memberships) {
      const now = new Date();
      const dateKey = dateKeyForTimeZone(now, membership.workspace.timezone);
      const minute = minuteOfDayForTimeZone(now, membership.workspace.timezone);
      if (minute < membership.workspace.missionGenerationMinute) continue;

      const idempotencyKey = [
        membership.workspaceId,
        membership.userId,
        dateKey,
        MISSION_ALGORITHM_VERSION,
      ].join(":");
      const run = await db.missionGenerationRun.findUnique({ where: { idempotencyKey } });
      if (run?.status === GenerationStatus.SUCCEEDED) continue;

      try {
        const result = await generateDailyMissions({
          workspaceId: membership.workspaceId,
          userId: membership.userId,
          dateKey,
        });
        log("info", "daily_missions_generated", {
          workspaceId: membership.workspaceId,
          userId: membership.userId,
          dateKey,
          selected: result.selected.length,
          capacityUsedMinutes: result.capacityUsedMinutes,
        });
      } catch (error) {
        log("error", "daily_mission_generation_failed", {
          workspaceId: membership.workspaceId,
          userId: membership.userId,
          dateKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    running = false;
  }
}

async function shutdown(signal: string): Promise<void> {
  stopping = true;
  log("info", "worker_shutdown", { signal });
  while (running) await new Promise((resolve) => setTimeout(resolve, 100));
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

log("info", "worker_started", { pollSeconds });
await runCycle();
setInterval(() => void runCycle(), pollSeconds * 1000);
await new Promise(() => undefined);
