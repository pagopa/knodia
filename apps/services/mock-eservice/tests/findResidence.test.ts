import { describe, expect, it } from "vitest";

import { findResidence } from "../src/data/naturalPersons.ts";
import { API_Notation } from "../src/models/api.ts";
import { type SignalHubSeedConfig } from "../src/signalHub/rotation.ts";

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
  it("returns personNotFound for an unknown notation", () => {
    expect(findResidence(UNKNOWN_NOTATION, nowAtPeriod(0), CONFIG)).toEqual({
      kind: "personNotFound",
    });
  });

  it("returns the same address across periods for a static entry", () => {
    const addresses = [0, 1, 2].map((p) => {
      const result = findResidence(STATIC_NOTATION, nowAtPeriod(p), CONFIG);
      return result.kind === "found" ? result.residence.address : undefined;
    });
    expect(addresses[0]).toBeDefined();
    expect(addresses[0]).toEqual(addresses[1]);
    expect(addresses[0]).toEqual(addresses[2]);
  });

  it("cycles found → found → residenceUnavailable for a rotating entry", () => {
    const results = [0, 1, 2, 3, 4, 5].map((p) =>
      findResidence(ROTATING_NOTATION, nowAtPeriod(p), CONFIG),
    );
    expect(results.map((r) => r.kind)).toEqual([
      "found",
      "found",
      "residenceUnavailable",
      "found",
      "found",
      "residenceUnavailable",
    ]);

    const addresses = results.map((r) =>
      r.kind === "found" ? r.residence.address : undefined,
    );
    expect(addresses[0]).toEqual(addresses[3]);
    expect(addresses[1]).toEqual(addresses[4]);
    expect(addresses[0]).not.toEqual(addresses[1]);
  });
});
