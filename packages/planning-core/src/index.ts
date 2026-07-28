export const MISSION_ALGORITHM_VERSION = "mission-score-v1";

export type EnergyLevel = "LOW" | "MEDIUM" | "HIGH";
export type CandidateStatus = "READY" | "IN_PROGRESS" | "BACKLOG" | "BLOCKED";

export interface MissionCandidate {
  id: string;
  title: string;
  objectivePath: string;
  status: CandidateStatus;
  estimatedMinutes: number;
  dueDateKey?: string | null;
  availableDateKey?: string | null;
  impact: number;
  urgency: number;
  strategicFit: number;
  revenueImpact: number;
  dependencyUnlock: number;
  confidence: number;
  objectivePriority: number;
  requiredEnergy: EnergyLevel;
}

export interface MissionSelectionInput {
  dateKey: string;
  capacityMinutes: number;
  maxMissions: number;
  availableEnergy: EnergyLevel;
  candidates: MissionCandidate[];
}

export interface ScoredMissionCandidate extends MissionCandidate {
  score: number;
  reason: string;
  scoreBreakdown: Record<string, number>;
}

export interface DeferredMissionCandidate {
  candidate: MissionCandidate;
  reason:
    | "NOT_READY"
    | "NOT_AVAILABLE_YET"
    | "TOO_LARGE_FOR_TODAY"
    | "CAPACITY_EXHAUSTED"
    | "MISSION_LIMIT_REACHED";
}

export interface MissionSelectionOutput {
  algorithm: string;
  dateKey: string;
  selected: ScoredMissionCandidate[];
  deferred: DeferredMissionCandidate[];
  capacityMinutes: number;
  capacityUsedMinutes: number;
  capacityRemainingMinutes: number;
}

const ENERGY_RANK: Record<EnergyLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

function clampScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

function parseDateKey(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date key: ${value}`);
  }
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

function daysBetween(fromDateKey: string, toDateKey: string): number {
  return Math.round((parseDateKey(toDateKey) - parseDateKey(fromDateKey)) / 86_400_000);
}

function dueDateBonus(dateKey: string, dueDateKey?: string | null): number {
  if (!dueDateKey) return 0;
  const days = daysBetween(dateKey, dueDateKey);
  if (days < 0) return 12;
  if (days === 0) return 10;
  if (days === 1) return 7;
  if (days <= 3) return 4;
  if (days <= 7) return 2;
  return 0;
}

function energyPenalty(available: EnergyLevel, required: EnergyLevel): number {
  const difference = ENERGY_RANK[required] - ENERGY_RANK[available];
  return difference > 0 ? difference * 8 : 0;
}

function effortPenalty(estimatedMinutes: number): number {
  if (estimatedMinutes <= 45) return 0;
  if (estimatedMinutes <= 90) return 2;
  return 5;
}

function buildReason(candidate: MissionCandidate, breakdown: Record<string, number>): string {
  const reasons: string[] = [];
  if (candidate.strategicFit >= 5) reasons.push("מחובר ישירות ליעד אסטרטגי");
  if (candidate.impact >= 5) reasons.push("השפעה גבוהה");
  if (candidate.dependencyUnlock >= 4) reasons.push("פותח משימות המשך");
  if (candidate.revenueImpact >= 4) reasons.push("פוטנציאל הכנסה משמעותי");
  if ((breakdown.dueDate ?? 0) >= 7) reasons.push("מועד קרוב או עבר");
  if (reasons.length === 0) reasons.push("הציון המשוקלל הגבוה ביותר במסגרת היום");
  return reasons.slice(0, 3).join(" · ");
}

export function scoreMissionCandidate(
  candidate: MissionCandidate,
  dateKey: string,
  availableEnergy: EnergyLevel,
): ScoredMissionCandidate {
  const breakdown: Record<string, number> = {
    impact: clampScale(candidate.impact) * 6,
    strategicFit: clampScale(candidate.strategicFit) * 6,
    urgency: clampScale(candidate.urgency) * 4,
    revenueImpact: clampScale(candidate.revenueImpact) * 2,
    dependencyUnlock: clampScale(candidate.dependencyUnlock) * 2,
    confidence: clampScale(candidate.confidence),
    objectivePriority: Math.min(10, Math.max(0, candidate.objectivePriority / 10)),
    dueDate: dueDateBonus(dateKey, candidate.dueDateKey),
    energyPenalty: -energyPenalty(availableEnergy, candidate.requiredEnergy),
    effortPenalty: -effortPenalty(candidate.estimatedMinutes),
  };

  const score = Number(
    Object.values(breakdown)
      .reduce((sum, value) => sum + value, 0)
      .toFixed(2),
  );

  return {
    ...candidate,
    score,
    reason: buildReason(candidate, breakdown),
    scoreBreakdown: breakdown,
  };
}

export function selectDailyMissions(input: MissionSelectionInput): MissionSelectionOutput {
  if (input.capacityMinutes < 0) throw new Error("capacityMinutes cannot be negative");
  if (input.maxMissions < 0) throw new Error("maxMissions cannot be negative");
  parseDateKey(input.dateKey);

  const deferred: DeferredMissionCandidate[] = [];
  const eligible: ScoredMissionCandidate[] = [];

  for (const candidate of input.candidates) {
    if (candidate.status !== "READY" && candidate.status !== "IN_PROGRESS") {
      deferred.push({ candidate, reason: "NOT_READY" });
      continue;
    }
    if (
      candidate.availableDateKey &&
      daysBetween(input.dateKey, candidate.availableDateKey) > 0
    ) {
      deferred.push({ candidate, reason: "NOT_AVAILABLE_YET" });
      continue;
    }
    if (candidate.estimatedMinutes > input.capacityMinutes) {
      deferred.push({ candidate, reason: "TOO_LARGE_FOR_TODAY" });
      continue;
    }
    eligible.push(scoreMissionCandidate(candidate, input.dateKey, input.availableEnergy));
  }

  eligible.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const leftDue = left.dueDateKey ?? "9999-12-31";
    const rightDue = right.dueDateKey ?? "9999-12-31";
    if (leftDue !== rightDue) return leftDue.localeCompare(rightDue);
    return left.id.localeCompare(right.id);
  });

  const selected: ScoredMissionCandidate[] = [];
  let used = 0;

  for (const candidate of eligible) {
    if (selected.length >= input.maxMissions) {
      deferred.push({ candidate, reason: "MISSION_LIMIT_REACHED" });
      continue;
    }
    if (used + candidate.estimatedMinutes > input.capacityMinutes) {
      deferred.push({ candidate, reason: "CAPACITY_EXHAUSTED" });
      continue;
    }
    selected.push(candidate);
    used += candidate.estimatedMinutes;
  }

  return {
    algorithm: MISSION_ALGORITHM_VERSION,
    dateKey: input.dateKey,
    selected,
    deferred,
    capacityMinutes: input.capacityMinutes,
    capacityUsedMinutes: used,
    capacityRemainingMinutes: Math.max(0, input.capacityMinutes - used),
  };
}
