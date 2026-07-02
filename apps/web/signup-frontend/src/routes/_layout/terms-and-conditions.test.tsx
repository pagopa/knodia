import { formatTermsDate } from "@knodia/terms-and-conditions-models";
import { describe, expect, it } from "vitest";

import { resolveAcceptanceDate } from "@/services/terms";

describe("resolveAcceptanceDate", () => {
  it("unauthenticated → the acceptance-date placeholder text", () => {
    expect(resolveAcceptanceDate("it", false, undefined)).toBe(
      "dell'accettazione",
    );
    expect(resolveAcceptanceDate("en", false, undefined)).toBe(
      "the date of acceptance",
    );
  });

  it("authenticated + onboarded → their formatted acceptance date", () => {
    const user = {
      email: "tester@example.org",
      knodes: [],
      onboardingStatus: "ACTIVE" as const,
      termsAcceptedAt: "2026-06-25T10:00:00.000Z",
    };
    expect(resolveAcceptanceDate("it", true, user)).toBe("25 giugno 2026");
    expect(resolveAcceptanceDate("en", true, user)).toBe("25 June 2026");
  });

  it("authenticated but user not yet loaded → placeholder, not today", () => {
    expect(resolveAcceptanceDate("it", true, undefined)).toBe(
      "dell'accettazione",
    );
    expect(resolveAcceptanceDate("en", true, undefined)).toBe(
      "the date of acceptance",
    );
  });

  it("authenticated + NOT_COMPLETED → today's date", () => {
    expect(
      resolveAcceptanceDate("it", true, { onboardingStatus: "NOT_COMPLETED" }),
    ).toBe(formatTermsDate(new Date(), "it"));
  });
});
