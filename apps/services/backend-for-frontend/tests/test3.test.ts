import { describe, expect, it } from "vitest";

describe("Sample Test", () => {
  it("should pass", async () => {
    expect(true).toBe(true);
  });

  it("should pass3 (slow)", async () => {
    expect(true).toBe(true);
  });
  it("should pass2", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    expect(true).toBe(true);
  });
});
