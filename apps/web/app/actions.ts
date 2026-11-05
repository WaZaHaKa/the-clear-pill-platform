"use server";

import { EnergyLevel, MissionStatus } from "@clearpill/db";
import {
  dateKeyForTimeZone,
  generateDailyMissions,
  getDefaultPilotContext,
  saveDailyCheckIn,
  saveDailyReflection,
  updateMissionStatus,
} from "@clearpill/planning-service";
import { revalidatePath } from "next/cache";
import { guardPrivatePage } from "../private-page-guard";

function requireDemoMode(): void {
  guardPrivatePage();
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("Pilot actions are disabled until authentication is configured");
  }
}

async function requirePilotContext() {
  const context = await getDefaultPilotContext();
  if (!context) throw new Error("No pilot workspace. Run the database seed.");
  return context;
}

export async function generateTodayAction(): Promise<void> {
  requireDemoMode();
  const context = await requirePilotContext();
  await generateDailyMissions({
    workspaceId: context.workspaceId,
    userId: context.userId,
    dateKey: dateKeyForTimeZone(new Date(), context.timezone),
  });
  revalidatePath("/today");
}

export async function saveCheckInAction(formData: FormData): Promise<void> {
  requireDemoMode();
  const context = await requirePilotContext();
  const dateKey = dateKeyForTimeZone(new Date(), context.timezone);
  const capacityMinutes = Number(formData.get("capacityMinutes"));
  const energyValue = String(formData.get("energy") ?? "");
  if (!Object.values(EnergyLevel).includes(energyValue as EnergyLevel)) {
    throw new Error("Invalid energy value");
  }
  await saveDailyCheckIn({
    workspaceId: context.workspaceId,
    userId: context.userId,
    dateKey,
    capacityMinutes,
    energy: energyValue as EnergyLevel,
    focusText: String(formData.get("focusText") ?? ""),
    constraints: String(formData.get("constraints") ?? ""),
  });
  revalidatePath("/today");
}

export async function saveReflectionAction(formData: FormData): Promise<void> {
  requireDemoMode();
  const context = await requirePilotContext();
  await saveDailyReflection({
    workspaceId: context.workspaceId,
    userId: context.userId,
    dateKey: dateKeyForTimeZone(new Date(), context.timezone),
    wins: String(formData.get("wins") ?? ""),
    blockers: String(formData.get("blockers") ?? ""),
    lesson: String(formData.get("lesson") ?? ""),
    tomorrowNote: String(formData.get("tomorrowNote") ?? ""),
  });
  revalidatePath("/today");
}

export async function missionStatusAction(formData: FormData): Promise<void> {
  requireDemoMode();
  const missionId = String(formData.get("missionId") ?? "");
  const requestedStatus = String(formData.get("status") ?? "");
  const evidence = String(formData.get("evidence") ?? "");
  if (!missionId) throw new Error("missionId is required");
  if (!Object.values(MissionStatus).includes(requestedStatus as MissionStatus)) {
    throw new Error("Invalid mission status");
  }
  await updateMissionStatus({
    missionId,
    status: requestedStatus as MissionStatus,
    evidence,
  });
  revalidatePath("/today");
  revalidatePath("/plan");
}
