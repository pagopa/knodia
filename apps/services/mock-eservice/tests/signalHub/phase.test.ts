import { describe, expect, it } from "vitest";

import { phaseAt } from "../../src/signalHub/phase.ts";

describe("phaseAt", () => {
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
  ])("phaseAt(%i) === %s", (periodId, expected) => {
    expect(phaseAt(periodId)).toBe(expected);
  });
});
