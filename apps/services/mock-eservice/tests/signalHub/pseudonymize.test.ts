import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { pseudonymize } from "../../src/signalHub/pseudonymize.ts";

describe("pseudonymize", () => {
  it("returns the same hex sha256 a consumer would compute from `fiscalCode + seed`", () => {
    const fc = "RMNLNR03H12H501Z";
    const seed = "abcdef0123456789";
    const expected = createHash("sha256")
      .update(fc + seed)
      .digest("hex");
    expect(pseudonymize(fc, seed)).toBe(expected);
  });

  it("differs across fiscal codes for the same seed", () => {
    const seed = "abcdef0123456789";
    expect(pseudonymize("RMNLNR03H12H501Z", seed)).not.toBe(
      pseudonymize("CNTLCC89E26L378K", seed),
    );
  });

  it("differs across seeds for the same fiscal code", () => {
    const fc = "RMNLNR03H12H501Z";
    expect(pseudonymize(fc, "seedA")).not.toBe(pseudonymize(fc, "seedB"));
  });
});
