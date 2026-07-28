import { describe, expect, it } from "vitest";
import { selectDailyMissions, type MissionCandidate } from "../src/index";

const base: MissionCandidate = {
  id: "base",
  title: "Base",
  objectivePath: "Five year > Year > Objective",
  status: "READY",
  estimatedMinutes: 30,
  impact: 3,
  urgency: 3,
  strategicFit: 3,
  revenueImpact: 1,
  dependencyUnlock: 1,
  confidence: 3,
  objectivePriority: 50,
  requiredEnergy: "MEDIUM",
};

describe("selectDailyMissions", () => {
  it("selects the most strategic, high-impact item first", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 90,
      maxMissions: 2,
      availableEnergy: "HIGH",
      candidates: [
        { ...base, id: "ordinary" },
        {
          ...base,
          id: "needle-mover",
          impact: 5,
          strategicFit: 5,
          dependencyUnlock: 5,
        },
      ],
    });
    expect(result.selected[0]?.id).toBe("needle-mover");
  });

  it("respects capacity instead of overloading the day", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 45,
      maxMissions: 3,
      availableEnergy: "MEDIUM",
      candidates: [
        { ...base, id: "a", estimatedMinutes: 30 },
        { ...base, id: "b", estimatedMinutes: 30 },
      ],
    });
    expect(result.selected).toHaveLength(1);
    expect(result.capacityUsedMinutes).toBe(30);
  });

  it("never selects blocked work", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 60,
      maxMissions: 3,
      availableEnergy: "HIGH",
      candidates: [{ ...base, id: "blocked", status: "BLOCKED", impact: 5 }],
    });
    expect(result.selected).toHaveLength(0);
    expect(result.deferred[0]?.reason).toBe("NOT_READY");
  });

  it("adds a due-date boost for overdue work", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 30,
      maxMissions: 1,
      availableEnergy: "HIGH",
      candidates: [
        { ...base, id: "later", dueDateKey: "2026-08-20" },
        { ...base, id: "overdue", dueDateKey: "2026-07-27" },
      ],
    });
    expect(result.selected[0]?.id).toBe("overdue");
  });

  it("is deterministic when scores and due dates tie", () => {
    const input = {
      dateKey: "2026-07-28",
      capacityMinutes: 30,
      maxMissions: 1,
      availableEnergy: "HIGH" as const,
      candidates: [
        { ...base, id: "b" },
        { ...base, id: "a" },
      ],
    };
    expect(selectDailyMissions(input).selected[0]?.id).toBe("a");
    expect(selectDailyMissions(input).selected[0]?.id).toBe("a");
  });

  it("respects the configured mission-count limit", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 180,
      maxMissions: 2,
      availableEnergy: "HIGH",
      candidates: [
        { ...base, id: "a" },
        { ...base, id: "b" },
        { ...base, id: "c" },
      ],
    });
    expect(result.selected).toHaveLength(2);
    expect(result.deferred.some((item) => item.reason === "MISSION_LIMIT_REACHED")).toBe(true);
  });

  it("defers work that is not available yet", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 60,
      maxMissions: 3,
      availableEnergy: "HIGH",
      candidates: [{ ...base, id: "future", availableDateKey: "2026-07-29" }],
    });
    expect(result.selected).toHaveLength(0);
    expect(result.deferred[0]?.reason).toBe("NOT_AVAILABLE_YET");
  });

  it("requires oversized work to be broken down instead of overloading the day", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 45,
      maxMissions: 3,
      availableEnergy: "HIGH",
      candidates: [{ ...base, id: "oversized", estimatedMinutes: 90 }],
    });
    expect(result.selected).toHaveLength(0);
    expect(result.deferred[0]?.reason).toBe("TOO_LARGE_FOR_TODAY");
  });

  it("penalizes high-energy work on a low-energy day", () => {
    const result = selectDailyMissions({
      dateKey: "2026-07-28",
      capacityMinutes: 30,
      maxMissions: 1,
      availableEnergy: "LOW",
      candidates: [
        { ...base, id: "low", requiredEnergy: "LOW" },
        { ...base, id: "high", requiredEnergy: "HIGH" },
      ],
    });
    expect(result.selected[0]?.id).toBe("low");
  });

});
