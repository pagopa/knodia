import { describe, expect, it } from "vitest";

import { formatTermsDate } from "../src/date.ts";

describe("formatTermsDate", () => {
  const date = new Date("2026-06-25T10:00:00Z");

  it("formats Italian as '25 giugno 2026'", () => {
    expect(formatTermsDate(date, "it")).toBe("25 giugno 2026");
  });

  it("formats English as '25 June 2026'", () => {
    expect(formatTermsDate(date, "en")).toBe("25 June 2026");
  });

  it("derives the calendar day in Europe/Rome (post-midnight CEST)", () => {
    // 23:30 UTC on the 24th is already 01:30 of the 25th in Rome (UTC+2).
    const lateNight = new Date("2026-06-24T23:30:00Z");
    expect(formatTermsDate(lateNight, "it")).toBe("25 giugno 2026");
  });
});
