import { describe, expect, it } from "vitest";

import { signalHubMockPhaseAt } from "../../src/signalHub/phase.ts";

describe("signalHubMockPhaseAt", () => {
  it.each([
    [0, "Create"],
    [1, "Update"],
    [2, "Delete"],
    [3, "Create"],
    [4, "Update"],
    [5, "Delete"],
    [99, "Create"],
    [100, "Update"],
    [101, "Delete"],
  ])("signalHubMockPhaseAt(%i) === %s", (periodId, expected) => {
    expect(signalHubMockPhaseAt(periodId)).toBe(expected);
  });
});
