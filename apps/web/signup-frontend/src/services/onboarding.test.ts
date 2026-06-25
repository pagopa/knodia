import { describe, expect, it } from "vitest";

import { resolveOnboardingRedirect } from "./onboarding";

describe("resolveOnboardingRedirect", () => {
  it("sends ACTIVE users to the home page", () => {
    expect(resolveOnboardingRedirect("ACTIVE")).toBe("/home");
  });

  it("sends NOT_COMPLETED users to the registration page", () => {
    expect(resolveOnboardingRedirect("NOT_COMPLETED")).toBe("/registration");
  });

  it("throws for SUSPENDED users until suspension handling lands", () => {
    expect(() => resolveOnboardingRedirect("SUSPENDED")).toThrow();
  });

  it("sends DELETION_PENDING users to the registration page", () => {
    expect(resolveOnboardingRedirect("DELETION_PENDING")).toBe("/registration");
  });
});
