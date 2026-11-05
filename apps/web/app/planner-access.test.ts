import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import { POST as generatePlanner } from "./api/v1/planning/generate/route";
import { GET as todayPlanner } from "./api/v1/planning/today/route";
import {
  generateTodayAction,
  missionStatusAction,
  saveCheckInAction,
  saveReflectionAction,
} from "./actions";

const originalPrivate = process.env.PRIVATE_PAGES_ENABLED;
const originalDemo = process.env.DEMO_MODE;

afterEach(() => {
  restore("PRIVATE_PAGES_ENABLED", originalPrivate);
  restore("DEMO_MODE", originalDemo);
});

function restore(name: "PRIVATE_PAGES_ENABLED" | "DEMO_MODE", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function setEnv(privateFlag: string | undefined, demo: string | undefined) {
  restore("PRIVATE_PAGES_ENABLED", privateFlag);
  restore("DEMO_MODE", demo);
}

describe("planner HTTP routes require private pages", () => {
  it("returns 404 when PRIVATE_PAGES_ENABLED is unset, even if DEMO_MODE is true", async () => {
    setEnv(undefined, "true");
    expect((await todayPlanner(new Request("http://internal.test/api/v1/planning/today"))).status).toBe(404);
    expect((await generatePlanner(new Request("http://internal.test/api/v1/planning/generate", { method: "POST", body: "{}" }))).status).toBe(404);
  });

  it("returns 404 when PRIVATE_PAGES_ENABLED is false or unexpected", async () => {
    for (const value of ["false", "", "1", "TRUE", "yes"]) {
      setEnv(value, "true");
      expect((await todayPlanner(new Request("http://internal.test/api/v1/planning/today"))).status).toBe(404);
      expect((await generatePlanner(new Request("http://internal.test/api/v1/planning/generate", { method: "POST", body: "{}" }))).status).toBe(404);
    }
  });

  it("still refuses demo access after the private-pages gate opens", async () => {
    setEnv("true", undefined);
    expect((await todayPlanner(new Request("http://internal.test/api/v1/planning/today"))).status).toBe(403);
    expect((await generatePlanner(new Request("http://internal.test/api/v1/planning/generate", { method: "POST", body: "{}" }))).status).toBe(403);
  });
});

describe("planner server actions require private pages", () => {
  it("fails closed with a 404 when the flag is unset or false", async () => {
    const form = new FormData();
    for (const value of [undefined, "false", "yes"]) {
      setEnv(value, "true");
      await expect(generateTodayAction()).rejects.toThrow("NOT_FOUND");
      await expect(saveCheckInAction(form)).rejects.toThrow("NOT_FOUND");
      await expect(saveReflectionAction(form)).rejects.toThrow("NOT_FOUND");
      await expect(missionStatusAction(form)).rejects.toThrow("NOT_FOUND");
    }
  });
});
