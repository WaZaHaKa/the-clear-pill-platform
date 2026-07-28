import {
  EnergyLevel as DbEnergyLevel,
  GenerationStatus,
  MissionEventType,
  MissionStatus,
  ObjectiveStatus,
  PlanStatus,
  Prisma,
  WorkItemStatus,
  db,
} from "@clearpill/db";
import {
  MISSION_ALGORITHM_VERSION,
  selectDailyMissions,
  type EnergyLevel,
  type MissionCandidate,
  type MissionSelectionOutput,
} from "@clearpill/planning-core";

const jsonCopy = <T>(value: T): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export function dateKeyForTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function minuteOfDayForTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

export async function getDefaultPilotContext(): Promise<{
  workspaceId: string;
  userId: string;
  timezone: string;
  displayName: string;
} | null> {
  const membership = await db.workspaceMember.findFirst({
    where: { isActive: true, workspace: { isActive: true } },
    orderBy: { createdAt: "asc" },
    include: { workspace: true, user: true },
  });
  if (!membership) return null;
  return {
    workspaceId: membership.workspaceId,
    userId: membership.userId,
    timezone: membership.workspace.timezone,
    displayName: membership.user.displayName,
  };
}

function mapEnergy(value: DbEnergyLevel): EnergyLevel {
  return value as EnergyLevel;
}

function objectivePath(item: {
  objective: {
    title: string;
    plan: {
      title: string;
      parentPlan: { title: string } | null;
    };
  };
}): string {
  return [item.objective.plan.parentPlan?.title, item.objective.plan.title, item.objective.title]
    .filter(Boolean)
    .join(" › ");
}

export async function generateDailyMissions(input: {
  workspaceId: string;
  userId: string;
  dateKey: string;
}): Promise<MissionSelectionOutput> {
  const idempotencyKey = [
    input.workspaceId,
    input.userId,
    input.dateKey,
    MISSION_ALGORITHM_VERSION,
  ].join(":");

  const previous = await db.missionGenerationRun.findUnique({ where: { idempotencyKey } });
  if (previous?.status === GenerationStatus.SUCCEEDED && previous.outputSnapshot) {
    return previous.outputSnapshot as unknown as MissionSelectionOutput;
  }

  const workspace = await db.workspace.findUnique({ where: { id: input.workspaceId } });
  if (!workspace || !workspace.isActive) throw new Error("Workspace is missing or inactive");

  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: input.workspaceId,
        userId: input.userId,
      },
    },
  });
  if (!membership?.isActive) throw new Error("User is not an active workspace member");

  const [checkIn, workItems] = await Promise.all([
    db.dailyCheckIn.findUnique({
      where: {
        workspaceId_userId_dateKey: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          dateKey: input.dateKey,
        },
      },
    }),
    db.workItem.findMany({
      where: {
        workspaceId: input.workspaceId,
        ownerId: input.userId,
        status: { in: [WorkItemStatus.READY, WorkItemStatus.IN_PROGRESS] },
        objective: {
          status: { in: [ObjectiveStatus.ACTIVE, ObjectiveStatus.AT_RISK] },
          plan: { status: PlanStatus.ACTIVE },
        },
      },
      include: {
        objective: {
          include: { plan: { include: { parentPlan: true } } },
        },
      },
    }),
  ]);

  const candidates: MissionCandidate[] = workItems.map((item) => ({
    id: item.id,
    title: item.title,
    objectivePath: objectivePath(item),
    status: item.status === WorkItemStatus.IN_PROGRESS ? "IN_PROGRESS" : "READY",
    estimatedMinutes: item.estimatedMinutes,
    dueDateKey: item.dueDateKey,
    availableDateKey: item.availableDateKey,
    impact: item.impact,
    urgency: item.urgency,
    strategicFit: item.strategicFit,
    revenueImpact: item.revenueImpact,
    dependencyUnlock: item.dependencyUnlock,
    confidence: item.confidence,
    objectivePriority: item.objective.priority,
    requiredEnergy: mapEnergy(item.requiredEnergy),
  }));

  const selectionInput = {
    dateKey: input.dateKey,
    capacityMinutes: checkIn?.capacityMinutes ?? workspace.dailyCapacityMinutes,
    maxMissions: workspace.maxDailyMissions,
    availableEnergy: mapEnergy(checkIn?.energy ?? DbEnergyLevel.MEDIUM),
    candidates,
  };
  const result = selectDailyMissions(selectionInput);

  let runId: string | null = previous?.id ?? null;
  try {
    if (runId) {
      await db.missionGenerationRun.update({
        where: { id: runId },
        data: {
          status: GenerationStatus.STARTED,
          inputSnapshot: jsonCopy(selectionInput),
          outputSnapshot: Prisma.JsonNull,
          errorMessage: null,
          completedAt: null,
        },
      });
    } else {
      const created = await db.missionGenerationRun.create({
        data: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          dateKey: input.dateKey,
          idempotencyKey,
          algorithm: MISSION_ALGORITHM_VERSION,
          status: GenerationStatus.STARTED,
          inputSnapshot: jsonCopy(selectionInput),
        },
      });
      runId = created.id;
    }

    await db.$transaction(async (tx) => {
      for (const [index, selected] of result.selected.entries()) {
        await tx.dailyMission.upsert({
          where: {
            workItemId_dateKey: { workItemId: selected.id, dateKey: input.dateKey },
          },
          update: {
            sequence: index + 1,
            titleSnapshot: selected.title,
            objectivePath: selected.objectivePath,
            reason: selected.reason,
            score: selected.score,
            plannedMinutes: selected.estimatedMinutes,
            generationRunId: runId,
          },
          create: {
            workspaceId: input.workspaceId,
            userId: input.userId,
            workItemId: selected.id,
            generationRunId: runId,
            dateKey: input.dateKey,
            sequence: index + 1,
            titleSnapshot: selected.title,
            objectivePath: selected.objectivePath,
            reason: selected.reason,
            score: selected.score,
            plannedMinutes: selected.estimatedMinutes,
            events: { create: { type: MissionEventType.CREATED } },
          },
        });
      }

      await tx.missionGenerationRun.update({
        where: { id: runId! },
        data: {
          status: GenerationStatus.SUCCEEDED,
          outputSnapshot: jsonCopy(result),
          completedAt: new Date(),
        },
      });

      await tx.auditEvent.create({
        data: {
          workspaceId: input.workspaceId,
          actorId: input.userId,
          eventType: "DAILY_MISSIONS_GENERATED",
          entityType: "MissionGenerationRun",
          entityId: runId,
          payload: jsonCopy({
            dateKey: input.dateKey,
            algorithm: MISSION_ALGORITHM_VERSION,
            selectedWorkItemIds: result.selected.map((item) => item.id),
            capacityUsedMinutes: result.capacityUsedMinutes,
          }),
        },
      });
    });

    return result;
  } catch (error) {
    if (runId) {
      await db.missionGenerationRun
        .update({
          where: { id: runId },
          data: {
            status: GenerationStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          },
        })
        .catch(() => undefined);
    }
    throw error;
  }
}

export async function getTodayDashboard(input: {
  workspaceId: string;
  userId: string;
  dateKey: string;
}) {
  const [workspace, user, checkIn, reflection, missions] = await Promise.all([
    db.workspace.findUnique({ where: { id: input.workspaceId } }),
    db.user.findUnique({ where: { id: input.userId } }),
    db.dailyCheckIn.findUnique({
      where: {
        workspaceId_userId_dateKey: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          dateKey: input.dateKey,
        },
      },
    }),
    db.dailyReflection.findUnique({
      where: {
        workspaceId_userId_dateKey: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          dateKey: input.dateKey,
        },
      },
    }),
    db.dailyMission.findMany({
      where: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        dateKey: input.dateKey,
      },
      orderBy: { sequence: "asc" },
      include: { workItem: { include: { objective: { include: { plan: true } } } } },
    }),
  ]);
  return { workspace, user, checkIn, reflection, missions, dateKey: input.dateKey };
}

export async function saveDailyCheckIn(input: {
  workspaceId: string;
  userId: string;
  dateKey: string;
  capacityMinutes: number;
  energy: DbEnergyLevel;
  focusText?: string;
  constraints?: string;
}): Promise<void> {
  if (!Number.isInteger(input.capacityMinutes) || input.capacityMinutes < 0 || input.capacityMinutes > 960) {
    throw new Error("capacityMinutes must be a whole number between 0 and 960");
  }
  await db.$transaction(async (tx) => {
    await tx.dailyCheckIn.upsert({
      where: {
        workspaceId_userId_dateKey: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          dateKey: input.dateKey,
        },
      },
      update: {
        capacityMinutes: input.capacityMinutes,
        energy: input.energy,
        focusText: input.focusText?.trim() || null,
        constraints: input.constraints?.trim() || null,
      },
      create: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        dateKey: input.dateKey,
        capacityMinutes: input.capacityMinutes,
        energy: input.energy,
        focusText: input.focusText?.trim() || null,
        constraints: input.constraints?.trim() || null,
      },
    });
    await tx.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.userId,
        eventType: "DAILY_CHECK_IN_SAVED",
        entityType: "DailyCheckIn",
        entityId: input.dateKey,
        payload: jsonCopy({
          dateKey: input.dateKey,
          capacityMinutes: input.capacityMinutes,
          energy: input.energy,
        }),
      },
    });
  });
}

export async function saveDailyReflection(input: {
  workspaceId: string;
  userId: string;
  dateKey: string;
  wins?: string;
  blockers?: string;
  lesson?: string;
  tomorrowNote?: string;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.dailyReflection.upsert({
      where: {
        workspaceId_userId_dateKey: {
          workspaceId: input.workspaceId,
          userId: input.userId,
          dateKey: input.dateKey,
        },
      },
      update: {
        wins: input.wins?.trim() || null,
        blockers: input.blockers?.trim() || null,
        lesson: input.lesson?.trim() || null,
        tomorrowNote: input.tomorrowNote?.trim() || null,
      },
      create: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        dateKey: input.dateKey,
        wins: input.wins?.trim() || null,
        blockers: input.blockers?.trim() || null,
        lesson: input.lesson?.trim() || null,
        tomorrowNote: input.tomorrowNote?.trim() || null,
      },
    });
    await tx.auditEvent.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.userId,
        eventType: "DAILY_REFLECTION_SAVED",
        entityType: "DailyReflection",
        entityId: input.dateKey,
        payload: jsonCopy({ dateKey: input.dateKey }),
      },
    });
  });
}

export async function updateMissionStatus(input: {
  missionId: string;
  status: MissionStatus;
  evidence?: string;
}): Promise<void> {
  const mission = await db.dailyMission.findUnique({ where: { id: input.missionId } });
  if (!mission) throw new Error("Mission not found");

  const now = new Date();
  const eventType =
    input.status === MissionStatus.DONE
      ? MissionEventType.COMPLETED
      : input.status === MissionStatus.IN_PROGRESS
        ? MissionEventType.STARTED
        : input.status === MissionStatus.SKIPPED
          ? MissionEventType.SKIPPED
          : MissionEventType.RESCHEDULED;

  await db.$transaction(async (tx) => {
    await tx.dailyMission.update({
      where: { id: mission.id },
      data: {
        status: input.status,
        completionEvidence: input.evidence?.trim() || null,
        startedAt:
          input.status === MissionStatus.IN_PROGRESS && !mission.startedAt
            ? now
            : mission.startedAt,
        completedAt: input.status === MissionStatus.DONE ? now : mission.completedAt,
      },
    });
    await tx.missionEvent.create({
      data: {
        missionId: mission.id,
        type: eventType,
        note: input.evidence?.trim() || null,
      },
    });
    if (input.status === MissionStatus.DONE) {
      await tx.workItem.update({
        where: { id: mission.workItemId },
        data: { status: WorkItemStatus.DONE },
      });
    }
    await tx.auditEvent.create({
      data: {
        workspaceId: mission.workspaceId,
        actorId: mission.userId,
        eventType: "MISSION_STATUS_CHANGED",
        entityType: "DailyMission",
        entityId: mission.id,
        payload: jsonCopy({ status: input.status, evidence: input.evidence ?? null }),
      },
    });
  });
}
