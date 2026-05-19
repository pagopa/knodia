import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  computePeriodId,
  getRotatedSeed,
  nextBoundaryMs,
  type SignalHubSeedConfig,
} from "../src/utils/rotation.ts";

const config: SignalHubSeedConfig = {
  expireSeconds: 30,
  saltLength: 16,
  startDateMs: 1_000_000,
};

const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);

describe("computePeriodId", () => {
  it("returns 0 at startDate", () => {
    expect(computePeriodId(1_000_000, config)).toBe(0);
  });

  it("returns 0 just before the first boundary", () => {
    expect(computePeriodId(1_000_000 + 29_999, config)).toBe(0);
  });

  it("rolls over exactly at the boundary", () => {
    expect(computePeriodId(1_000_000 + 30_000, config)).toBe(1);
  });

  it("counts subsequent periods", () => {
    expect(computePeriodId(1_000_000 + 90_000, config)).toBe(3);
  });
});

describe("getRotatedSeed", () => {
  it("is deterministic for the same (eserviceId, periodId)", () => {
    const t = 1_000_000 + 10_000;
    expect(getRotatedSeed(ESERVICE_ID, t, config)).toBe(
      getRotatedSeed(ESERVICE_ID, t, config),
    );
  });

  it("yields different seeds across periods", () => {
    const seed0 = getRotatedSeed(ESERVICE_ID, 1_000_000, config);
    const seed1 = getRotatedSeed(ESERVICE_ID, 1_000_000 + 30_000, config);
    const seed2 = getRotatedSeed(ESERVICE_ID, 1_000_000 + 60_000, config);
    expect(new Set([seed0, seed1, seed2]).size).toBe(3);
  });

  it("respects saltLength", () => {
    expect(
      getRotatedSeed(ESERVICE_ID, 1_000_000, {
        ...config,
        saltLength: 8,
      }),
    ).toHaveLength(8);
  });
});

describe("nextBoundaryMs", () => {
  it("returns the next period start", () => {
    expect(nextBoundaryMs(1_000_000, config)).toBe(1_030_000);
    expect(nextBoundaryMs(1_029_999, config)).toBe(1_030_000);
    expect(nextBoundaryMs(1_030_000, config)).toBe(1_060_000);
  });
});
