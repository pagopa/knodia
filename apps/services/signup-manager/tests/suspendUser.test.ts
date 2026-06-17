import { SignupEventV1 } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { kafkaProducerMock } from "./setup.ts";
import {
  getAllSignupUsers,
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validSuspendUserBody,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

describe("POST /user/suspend (suspendUser)", () => {
  it("should return 204 on successful suspension request", async () => {
    const signupUser = makeSignupUser({
      fiscalNumber: validUISignupSessionTokenClaims.fiscalNumber,
      spidCode: validUISignupSessionTokenClaims.spidCode,
    });
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest()
      .post("/user/suspend")
      .body(validSuspendUserBody);

    expect(response.statusCode).toBe(204);

    const signupUsers = await getAllSignupUsers();
    expect(signupUsers).toHaveLength(1);

    const suspendedSignupUser = signupUsers[0];

    expect(suspendedSignupUser).toEqual({
      ...signupUser,
      status: "Suspended",
      suspendedAt: expect.any(Date),
      suspensionReason: "UnlawfulProcessing",
      updatedAt: expect.any(Date),
    });

    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();

    const [sendPayload] = kafkaProducerMock.send.mock.calls[0] ?? [];

    expect(sendPayload).toEqual({
      messages: [{ value: expect.any(String) }],
      topic: "test-signup-topic",
    });

    const messageValue = sendPayload?.messages[0]?.value;
    expect(messageValue).toBeDefined();

    const event = SignupEventV1.parse(JSON.parse(messageValue as string));

    expect(event).toEqual({
      data: {
        occurredAt: expect.any(String),
        oneIdNonce: validUISignupSessionTokenClaims.oneIdNonce,
        reason: "UnlawfulProcessing",
        signupUserId: signupUser.signupUserId,
      },
      type: "SuspensionRequestedV1",
    });
  });

  it.each([
    ["reason is missing", {}],
    ["reason is not one of the allowed enum values", { reason: "INVALID" }],
    [
      "body contains unexpected properties",
      { ...validSuspendUserBody, unexpectedProperty: "unexpected" },
    ],
  ])("should return 400 when the %s", async (_label, body) => {
    const response = await injectSignupAppRequest()
      .post("/user/suspend")
      .body(body);

    expect(response.statusCode).toBe(400);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    })
      .post("/user/suspend")
      .body(validSuspendUserBody);

    expect(response.statusCode).toBe(403);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is not onboarded", async () => {
    const response = await injectSignupAppRequest()
      .post("/user/suspend")
      .body(validSuspendUserBody);

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is already suspended", async () => {
    const suspendedAt = new Date("2026-01-01T01:00:00.000Z");
    const signupUser = makeSignupUser({
      fiscalNumber: validUISignupSessionTokenClaims.fiscalNumber,
      spidCode: validUISignupSessionTokenClaims.spidCode,
      status: "Suspended",
      suspendedAt,
      suspensionReason: "AccuracyContested",
      updatedAt: suspendedAt,
    });
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest()
      .post("/user/suspend")
      .body(validSuspendUserBody);

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();

    const signupUsers = await getAllSignupUsers();
    expect(signupUsers).toHaveLength(1);
    expect(signupUsers[0]).toEqual({
      ...signupUser,
      suspendedAt,
      updatedAt: suspendedAt,
    });
  });
});
