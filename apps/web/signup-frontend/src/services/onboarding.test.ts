import { describe, expect, it } from "vitest";

import {
  isOnboardingPending,
  keepsUserOnRegistration,
  resolveOnboardingRedirect,
} from "./onboarding";

describe("isOnboardingPending", () => {
  it("is true only while provisioning is in progress", () => {
    expect(isOnboardingPending("ONBOARDING_PENDING")).toBe(true);
  });

  it.each([
    "ACTIVE",
    "NOT_COMPLETED",
    "SUSPENDED",
    "DELETION_PENDING",
  ] as const)("is false for %s", (status) => {
    expect(isOnboardingPending(status)).toBe(false);
  });
});

describe("keepsUserOnRegistration", () => {
  it.each(["NOT_COMPLETED", "ONBOARDING_PENDING"] as const)(
    "is true for %s (onboarding not finished)",
    (status) => {
      expect(keepsUserOnRegistration(status)).toBe(true);
    },
  );

  it.each(["ACTIVE", "SUSPENDED", "DELETION_PENDING"] as const)(
    "is false for %s",
    (status) => {
      expect(keepsUserOnRegistration(status)).toBe(false);
    },
  );
});

describe("resolveOnboardingRedirect", () => {
  it("sends ACTIVE users to the home page", () => {
    expect(resolveOnboardingRedirect("ACTIVE")).toBe("/home");
  });

  it("sends NOT_COMPLETED users to the registration page", () => {
    expect(resolveOnboardingRedirect("NOT_COMPLETED")).toBe("/registration");
  });

  it("sends SUSPENDED users to the suspended page", () => {
    expect(resolveOnboardingRedirect("SUSPENDED")).toBe("/suspended");
  });

  it("keeps ONBOARDING_PENDING users on the registration page", () => {
    expect(resolveOnboardingRedirect("ONBOARDING_PENDING")).toBe(
      "/registration",
    );
  });

  it("sends DELETION_PENDING users to the registration page", () => {
    expect(resolveOnboardingRedirect("DELETION_PENDING")).toBe("/registration");
  });
});
