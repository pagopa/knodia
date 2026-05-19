import { describe, expect, it } from "vitest";

import { phaseAt } from "../src/phase.ts";

describe("phaseAt", () => {
  it.each([
    [0, "CREATE"],
    [1, "UPDATE"],
    [2, "DELETE"],
    [3, "CREATE"],
    [4, "UPDATE"],
    [5, "DELETE"],
    [99, "CREATE"],
    [100, "UPDATE"],
    [101, "DELETE"],
  ])("phaseAt(%i) === %s", (periodId, expected) => {
    expect(phaseAt(periodId)).toBe(expected);
  });
});
