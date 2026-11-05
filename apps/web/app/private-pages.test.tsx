import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import PlanLayout from "./plan/layout";
import TodayLayout from "./today/layout";
import { proxy } from "../proxy";
import { isPrivatePlannerPath, privatePagesEnabled } from "../private-pages";

const original = process.env.PRIVATE_PAGES_ENABLED;

afterEach(() => {
  if (original === undefined) delete process.env.PRIVATE_PAGES_ENABLED;
  else process.env.PRIVATE_PAGES_ENABLED = original;
});

function setFlag(value: string | undefined) {
  if (value === undefined) delete process.env.PRIVATE_PAGES_ENABLED;
  else process.env.PRIVATE_PAGES_ENABLED = value;
}

describe("private planner pages fail closed", () => {
  it("stays closed when PRIVATE_PAGES_ENABLED is unset", () => {
    setFlag(undefined);
    expect(privatePagesEnabled()).toBe(false);
    expect(statusFor("/plan")).toBe(404);
    expect(statusFor("/today")).toBe(404);
    expect(statusFor("/plan/detail")).toBe(404);
    expect(statusFor("/today/1")).toBe(404);
    expect(() => renderToStaticMarkup(<PlanLayout><p>hidden plan</p></PlanLayout>)).toThrow("NOT_FOUND");
    expect(() => renderToStaticMarkup(<TodayLayout><p>hidden today</p></TodayLayout>)).toThrow("NOT_FOUND");
  });

  it("stays closed when PRIVATE_PAGES_ENABLED is false or unexpected", () => {
    for (const value of ["false", "", "1", "TRUE", "yes"]) {
      setFlag(value);
      expect(privatePagesEnabled()).toBe(false);
      expect(statusFor("/plan")).toBe(404);
      expect(statusFor("/today")).toBe(404);
    }
  });

  it("does not hide the public hub", () => {
    setFlag(undefined);
    expect(statusFor("/")).toBe(200);
    expect(statusFor("/support")).toBe(200);
    expect(isPrivatePlannerPath("/planner")).toBe(false);
    expect(isPrivatePlannerPath("/today-notes")).toBe(false);
  });

  it("allows /plan and /today only when the flag is exactly true", () => {
    setFlag("true");
    expect(privatePagesEnabled()).toBe(true);
    expect(statusFor("/plan")).toBe(200);
    expect(statusFor("/today")).toBe(200);
    const html = renderToStaticMarkup(
      <TodayLayout>
        <p>internal today</p>
      </TodayLayout>,
    );
    expect(html).toContain("internal today");
    expect(html).toContain('dir="rtl"');
  });
});

function statusFor(path: string): number {
  return proxy(new NextRequest(`http://internal.test${path}`)).status;
}
