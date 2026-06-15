import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { SignupEventV1 } from "../src/signupEvent.ts";

function validOnboardingData() {
  return {
    occurredAt: "2026-05-28T10:00:00.000Z",
    oneIdNonce: generateId(),
    signupUserId: generateId<SignupUserId>(),
    termsAcceptanceDigest: "a".repeat(64),
    termsAcceptanceVersion: "1.0.0",
  };
}

describe("SignupEventV1", () => {
  it("parses a valid OnboardingCompletedV1 event", () => {
    const event: SignupEventV1 = {
      data: validOnboardingData(),
      type: "OnboardingCompletedV1",
    };

    expect(SignupEventV1.parse(event)).toEqual(event);
  });

  it("rejects an unknown discriminator", () => {
    expect(() =>
      SignupEventV1.parse({
        data: validOnboardingData(),
        type: "UnknownEventV1",
      }),
    ).toThrow();
  });

  it("rejects a signupUserId that is not a UUID", () => {
    expect(() =>
      SignupEventV1.parse({
        data: { ...validOnboardingData(), signupUserId: "not-a-uuid" },
        type: "OnboardingCompletedV1",
      }),
    ).toThrow();
  });

  it("rejects an OnboardingCompletedV1 event missing the oneIdNonce", () => {
    const data = validOnboardingData();
    delete (data as Partial<typeof data>).oneIdNonce;

    expect(() =>
      SignupEventV1.parse({ data, type: "OnboardingCompletedV1" }),
    ).toThrow();
  });

  it("rejects a termsAcceptanceDigest that is not 64 hex chars", () => {
    expect(() =>
      SignupEventV1.parse({
        data: { ...validOnboardingData(), termsAcceptanceDigest: "deadbeef" },
        type: "OnboardingCompletedV1",
      }),
    ).toThrow();
  });

  it("rejects an occurredAt that is not an ISO datetime", () => {
    expect(() =>
      SignupEventV1.parse({
        data: { ...validOnboardingData(), occurredAt: "2026-05-28" },
        type: "OnboardingCompletedV1",
      }),
    ).toThrow();
  });
});
