import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { SignupEventV1 } from "../src/signupEvent.ts";

describe("SignupEventV1", () => {
  it("parses a valid OnboardingCompletedV1 event", () => {
    const signupUserId = generateId<SignupUserId>();
    const event: SignupEventV1 = {
      data: { signupUserId },
      type: "OnboardingCompletedV1",
    };

    expect(SignupEventV1.parse(event)).toEqual(event);
  });

  it("rejects an unknown discriminator", () => {
    expect(() =>
      SignupEventV1.parse({
        data: { signupUserId: generateId<SignupUserId>() },
        type: "UnknownEventV1",
      }),
    ).toThrow();
  });

  it("rejects a signupUserId that is not a UUID", () => {
    expect(() =>
      SignupEventV1.parse({
        data: { signupUserId: "not-a-uuid" },
        type: "OnboardingCompletedV1",
      }),
    ).toThrow();
  });
});
