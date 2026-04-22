import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getRecentUpdateCutoffDate,
  hasRecentlyBeenUpdated,
} from "../src/utils/recentUpdate.ts";

describe("getRecentUpdateCutoffDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a date N days in the past", () => {
    expect(getRecentUpdateCutoffDate(3)).toEqual(
      new Date("2026-04-11T12:00:00Z"),
    );
  });

  it("returns the current date when days is 0", () => {
    expect(getRecentUpdateCutoffDate(0)).toEqual(
      new Date("2026-04-14T12:00:00Z"),
    );
  });

  it("works with 1 day", () => {
    expect(getRecentUpdateCutoffDate(1)).toEqual(
      new Date("2026-04-13T12:00:00Z"),
    );
  });
});

describe("hasRecentlyBeenUpdated", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when updated today", () => {
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-14T10:00:00Z" }, 3),
    ).toBe(true);
  });

  it("returns true when updated within the threshold", () => {
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-12T12:00:00Z" }, 3),
    ).toBe(true);
  });

  it("returns false when updated before the threshold", () => {
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-10T12:00:00Z" }, 3),
    ).toBe(false);
  });

  it("returns true at the exact boundary", () => {
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-11T12:00:00Z" }, 3),
    ).toBe(true);
  });

  it("returns false one millisecond before the boundary", () => {
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-11T11:59:59.999Z" }, 3),
    ).toBe(false);
  });

  it("works with a threshold of 1 day", () => {
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-13T13:00:00Z" }, 1),
    ).toBe(true);
    expect(
      hasRecentlyBeenUpdated({ updatedAt: "2026-04-12T11:00:00Z" }, 1),
    ).toBe(false);
  });
});
