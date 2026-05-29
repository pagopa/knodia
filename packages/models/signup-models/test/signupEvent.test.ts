import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { OnboardingCompletedV1 as OnboardingCompletedProtoV1 } from "../src/generated/v1/signupEvents.ts";
import { SignupEventV1 } from "../src/signupEvent.ts";

describe("SignupEventV1 codec", () => {
  it("encodes and decodes an OnboardingCompletedV1 payload", () => {
    const signupUserId = generateId<SignupUserId>();
    const event: SignupEventV1 = {
      data: { signupUserId },
      type: "OnboardingCompletedV1",
    };

    const encoded = SignupEventV1.encode(event);
    expect(encoded.type).toBe("OnboardingCompletedV1");
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = SignupEventV1.decode(encoded);
    expect(decoded).toEqual(event);
    expect(decoded.data.signupUserId).toBe(signupUserId);
  });

  it("rejects an unknown discriminator", () => {
    expect(() =>
      SignupEventV1.decode({
        data: OnboardingCompletedProtoV1.encode({
          signupUserId: generateId<SignupUserId>(),
        }).finish(),
        // @ts-expect-error invalid type at runtime is the whole point
        type: "UnknownEventV1",
      }),
    ).toThrow();
  });

  it("rejects a payload that is valid protobuf but decodes to an empty signupUserId", () => {
    // OnboardingCompletedProtoV1 default-encodes signupUserId="" to zero bytes.
    const emptyPayloadBytes = OnboardingCompletedProtoV1.encode({
      signupUserId: "",
    }).finish();

    expect(() =>
      SignupEventV1.decode({
        data: emptyPayloadBytes,
        type: "OnboardingCompletedV1",
      }),
    ).toThrow();
  });

  it("rejects a payload whose signupUserId is not a UUID", () => {
    const bytes = OnboardingCompletedProtoV1.encode({
      signupUserId: "not-a-uuid",
    }).finish();

    expect(() =>
      SignupEventV1.decode({
        data: bytes,
        type: "OnboardingCompletedV1",
      }),
    ).toThrow();
  });
});
