import { SignupEventV1, SignupUserStatus } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { kafkaProducerMock } from "./setup.ts";
import {
  getAllSignupUsers,
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

function makeMatchingSignupUser(
  overrides: Parameters<typeof makeSignupUser>[0] = {},
) {
  return makeSignupUser(overrides, {
    spidCode: validUISignupSessionTokenClaims.spidCode,
  });
}

describe("POST /user/resetCredentials (resetCredentials)", () => {
  it("should return 204, leave the user untouched and publish the reset event", async () => {
    const signupUser = makeMatchingSignupUser();
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().post(
      "/user/resetCredentials",
    );

    expect(response.statusCode).toBe(204);

    // The reset is a pure Cognito side-effect: nothing on the row changes.
    const [row] = await getAllSignupUsers();
    expect(row?.status).toBe("Active");
    expect(row?.updatedAt).toEqual(signupUser.updatedAt);

    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();
    const [sendPayload] = kafkaProducerMock.send.mock.calls[0] ?? [];
    expect(sendPayload).toEqual({
      messages: [{ key: signupUser.signupUserId, value: expect.any(String) }],
      topic: "test-signup-topic",
    });

    const event = SignupEventV1.parse(
      JSON.parse(sendPayload?.messages.at(0)?.value as string),
    );
    expect(event).toEqual({
      data: {
        occurredAt: expect.any(String),
        oneIdNonce: validUISignupSessionTokenClaims.oneIdNonce,
        signupUserId: signupUser.signupUserId,
      },
      type: "CredentialResetRequestedV1",
    });
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    }).post("/user/resetCredentials");

    expect(response.statusCode).toBe(403);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is not onboarded", async () => {
    const response = await injectSignupAppRequest().post(
      "/user/resetCredentials",
    );

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is not active", async () => {
    await seedSignupUser(
      makeMatchingSignupUser({
        status: SignupUserStatus.enum.Suspended,
        suspendedAt: new Date("2026-01-01T01:00:00.000Z"),
        suspensionReason: "AccuracyContested",
      }),
    );

    const response = await injectSignupAppRequest().post(
      "/user/resetCredentials",
    );

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });
});
