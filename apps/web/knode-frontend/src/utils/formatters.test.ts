import { describe, expect, it } from "vitest";

import { formatNumber } from "./formatters";

describe("formatNumber", () => {
  it("truncates fractional digits (rounds to nearest integer)", () => {
    expect(formatNumber(1.4)).toBe("1");
    expect(formatNumber(1.5)).toBe("2");
  });

  it("uses the en-GB thousands separator (,) for numbers >= 1 000", () => {
    expect(formatNumber(1_000)).toBe("1,000");
    expect(formatNumber(1_000_000)).toBe("1,000,000");
  });

  it("formats negative numbers", () => {
    expect(formatNumber(-1_000)).toBe("-1,000");
  });
});
