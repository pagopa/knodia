import {
  type EmailChangeRequestId,
  generateId,
  type SignupUserId,
} from "@knodia/common-models/ids";
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

function validSuspensionData() {
  return {
    occurredAt: "2026-05-29T10:00:00.000Z",
    oneIdNonce: generateId(),
    reason: "UnlawfulProcessing" as const,
    signupUserId: generateId<SignupUserId>(),
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

  it("parses a valid EmailChangeRequestedV1 event", () => {
    const signupUserId = generateId<SignupUserId>();
    const emailChangeRequestId = generateId<EmailChangeRequestId>();
    const event: SignupEventV1 = {
      data: { emailChangeRequestId, signupUserId },
      type: "EmailChangeRequestedV1",
    };

    expect(SignupEventV1.parse(event)).toEqual(event);
  });

  it("parses a valid SuspensionRequestedV1 event", () => {
    const event: SignupEventV1 = {
      data: validSuspensionData(),
      type: "SuspensionRequestedV1",
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

  it("rejects an emailChangeRequestId that is not a UUID", () => {
    expect(() =>
      SignupEventV1.parse({
        data: {
          emailChangeRequestId: "not-a-uuid",
          signupUserId: generateId<SignupUserId>(),
        },
        type: "EmailChangeRequestedV1",
      }),
    ).toThrow();
  });

  it("rejects an invalid suspension reason", () => {
    expect(() =>
      SignupEventV1.parse({
        data: { ...validSuspensionData(), reason: "OTHER" },
        type: "SuspensionRequestedV1",
      }),
    ).toThrow();
  });
});
