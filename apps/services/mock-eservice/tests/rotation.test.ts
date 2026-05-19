import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  computePeriodId,
  getRotatedSeed,
  type SignalHubSeedConfig,
} from "../src/utils/rotation.ts";

const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const ANOTHER_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "11111111-1111-4111-8111-111111111111",
);

const CONFIG: SignalHubSeedConfig = {
  expireSeconds: 30,
  saltLength: 16,
  startDateMs: 1_000_000,
};

describe("computePeriodId", () => {
  it("returns 0 at startDate", () => {
    expect(computePeriodId(CONFIG.startDateMs, CONFIG)).toBe(0);
  });

  it("returns 0 just before the first boundary", () => {
    expect(computePeriodId(CONFIG.startDateMs + 29_999, CONFIG)).toBe(0);
  });

  it("rolls over exactly at the boundary", () => {
    expect(computePeriodId(CONFIG.startDateMs + 30_000, CONFIG)).toBe(1);
  });

  it("counts subsequent periods", () => {
    expect(computePeriodId(CONFIG.startDateMs + 90_000, CONFIG)).toBe(3);
  });
});

describe("getRotatedSeed", () => {
  const nowAtPeriod = (periodId: number) =>
    CONFIG.startDateMs + periodId * CONFIG.expireSeconds * 1000;

  it("is deterministic for the same (eserviceId, now)", () => {
    expect(getRotatedSeed(ESERVICE_ID, nowAtPeriod(7), CONFIG)).toBe(
      getRotatedSeed(ESERVICE_ID, nowAtPeriod(7), CONFIG),
    );
  });

  it("yields different seeds across periods", () => {
    const seeds = [0, 1, 2].map((p) =>
      getRotatedSeed(ESERVICE_ID, nowAtPeriod(p), CONFIG),
    );
    expect(new Set(seeds).size).toBe(3);
  });

  it("yields different seeds across eservices for the same period", () => {
    expect(getRotatedSeed(ESERVICE_ID, nowAtPeriod(0), CONFIG)).not.toBe(
      getRotatedSeed(ANOTHER_ESERVICE_ID, nowAtPeriod(0), CONFIG),
    );
  });

  it("respects saltLength", () => {
    expect(
      getRotatedSeed(ESERVICE_ID, nowAtPeriod(0), { ...CONFIG, saltLength: 8 }),
    ).toHaveLength(8);
    expect(
      getRotatedSeed(ESERVICE_ID, nowAtPeriod(0), {
        ...CONFIG,
        saltLength: 32,
      }),
    ).toHaveLength(32);
  });
});
