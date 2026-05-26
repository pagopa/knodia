import { describe, expect, it } from "vitest";

import { findResidence } from "../src/data/naturalPersons.ts";
import { API_Notation } from "../src/models/api.ts";
import { type SignalHubSeedConfig } from "../src/utils/rotation.ts";

const ROTATING_NOTATION = API_Notation.parse("RMNLNR03H12H501Z");
const STATIC_NOTATION = API_Notation.parse("BNCFNC67D61H703B");
const UNKNOWN_NOTATION = API_Notation.parse("AAAAAA00A00A000A");

const CONFIG: SignalHubSeedConfig = {
  expireSeconds: 30,
  saltLength: 16,
  startDateMs: 0,
};

const nowAtPeriod = (periodId: number) =>
  periodId * CONFIG.expireSeconds * 1000;

describe("findResidence", () => {
  it("returns undefined for an unknown notation", () => {
    expect(
      findResidence(UNKNOWN_NOTATION, nowAtPeriod(0), CONFIG),
    ).toBeUndefined();
  });

  it("returns the same address across periods for a static entry", () => {
    const r0 = findResidence(STATIC_NOTATION, nowAtPeriod(0), CONFIG);
    const r1 = findResidence(STATIC_NOTATION, nowAtPeriod(1), CONFIG);
    const r2 = findResidence(STATIC_NOTATION, nowAtPeriod(2), CONFIG);
    expect(r0).toBeDefined();
    expect(r0?.address).toEqual(r1?.address);
    expect(r0?.address).toEqual(r2?.address);
  });

  it("cycles A → B → undefined → A → B → undefined for a rotating entry", () => {
    const responses = [0, 1, 2, 3, 4, 5].map((p) =>
      findResidence(ROTATING_NOTATION, nowAtPeriod(p), CONFIG),
    );

    expect(responses[0]).toBeDefined();
    expect(responses[1]).toBeDefined();
    expect(responses[2]).toBeUndefined();
    expect(responses[3]).toBeDefined();
    expect(responses[4]).toBeDefined();
    expect(responses[5]).toBeUndefined();

    expect(responses[0]?.address).toEqual(responses[3]?.address);
    expect(responses[1]?.address).toEqual(responses[4]?.address);

    expect(responses[0]?.address).not.toEqual(responses[1]?.address);
  });
});
