import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { computePeriodId, getRotatedSeed } from "../src/utils/rotation.ts";

const ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const ANOTHER_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "11111111-1111-4111-8111-111111111111",
);

describe("computePeriodId", () => {
  it("returns 0 at startDate", () => {
    expect(computePeriodId(1_000_000, 1_000_000, 30)).toBe(0);
  });

  it("returns 0 just before the first boundary", () => {
    expect(computePeriodId(1_000_000 + 29_999, 1_000_000, 30)).toBe(0);
  });

  it("rolls over exactly at the boundary", () => {
    expect(computePeriodId(1_000_000 + 30_000, 1_000_000, 30)).toBe(1);
  });

  it("counts subsequent periods", () => {
    expect(computePeriodId(1_000_000 + 90_000, 1_000_000, 30)).toBe(3);
  });
});

describe("getRotatedSeed", () => {
  it("is deterministic for the same (eserviceId, periodId)", () => {
    const opts = { algorithm: "sha256", saltLength: 16 };
    expect(getRotatedSeed(ESERVICE_ID, 7, opts)).toBe(
      getRotatedSeed(ESERVICE_ID, 7, opts),
    );
  });

  it("yields different seeds across periods", () => {
    const opts = { algorithm: "sha256", saltLength: 16 };
    const seed0 = getRotatedSeed(ESERVICE_ID, 0, opts);
    const seed1 = getRotatedSeed(ESERVICE_ID, 1, opts);
    const seed2 = getRotatedSeed(ESERVICE_ID, 2, opts);
    expect(new Set([seed0, seed1, seed2]).size).toBe(3);
  });

  it("yields different seeds across eservices for the same period", () => {
    const opts = { algorithm: "sha256", saltLength: 16 };
    expect(getRotatedSeed(ESERVICE_ID, 0, opts)).not.toBe(
      getRotatedSeed(ANOTHER_ESERVICE_ID, 0, opts),
    );
  });

  it("respects saltLength", () => {
    expect(
      getRotatedSeed(ESERVICE_ID, 0, { algorithm: "sha256", saltLength: 8 }),
    ).toHaveLength(8);
    expect(
      getRotatedSeed(ESERVICE_ID, 0, { algorithm: "sha256", saltLength: 32 }),
    ).toHaveLength(32);
  });
});
