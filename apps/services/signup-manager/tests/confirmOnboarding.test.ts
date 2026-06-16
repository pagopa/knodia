import { SignupEventV1 } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import {
  computeTermsAcceptanceDigest,
  TERMS_AND_CONDITIONS_VERSION,
} from "../src/utils/termsAcceptance.ts";
import { kafkaProducerMock } from "./setup.ts";
import {
  getAllSignupUsers,
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validConfirmOnboardingBody,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

describe("POST /user/confirmOnboarding (confirmOnboarding)", () => {
  it("should return 204 on successful onboarding confirmation", async () => {
    const response = await injectSignupAppRequest()
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(204);

    const signupUsers = await getAllSignupUsers();
    expect(signupUsers).toHaveLength(1);

    const signupUser = signupUsers[0];

    expect(signupUser).toEqual({
      createdAt: expect.any(Date),
      dateOfBirth: validUISignupSessionTokenClaims.dateOfBirth,
      email: validConfirmOnboardingBody.email,
      familyName: validUISignupSessionTokenClaims.familyName,
      fiscalNumber: validUISignupSessionTokenClaims.fiscalNumber,
      lynxOrganizationName: expect.any(String),
      lynxUserName: expect.any(String),
      name: validUISignupSessionTokenClaims.name,
      orionOrganizationName: expect.any(String),
      orionUserName: expect.any(String),
      personIdentifier: null,
      signupUserId: expect.any(String),
      spidCode: validUISignupSessionTokenClaims.spidCode,
      status: "Active",
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

    const event = SignupEventV1.parse(
      JSON.parse(messageValue as string),
    ) as SignupEventV1 & { type: "OnboardingCompletedV1" };

    expect(event).toEqual({
      data: {
        occurredAt: expect.any(String),
        oneIdNonce: validUISignupSessionTokenClaims.oneIdNonce,
        signupUserId: signupUser?.signupUserId,
        termsAcceptanceDigest: expect.any(String),
        termsAcceptanceVersion: TERMS_AND_CONDITIONS_VERSION,
      },
      type: "OnboardingCompletedV1",
    });

    // The acceptance instant travels in the message (not the DB); the digest is
    // derived from it, so it must match a recomputation over occurredAt.
    expect(event.data.termsAcceptanceDigest).toBe(
      computeTermsAcceptanceDigest(new Date(event.data.occurredAt)),
    );
  });

  it.each([
    ["email is missing", {}],
    ["email is not valid", { email: "not-an-email" }],
    [
      "body contains unexpected properties",
      { ...validConfirmOnboardingBody, unexpectedProperty: "unexpected" },
    ],
  ])("should return 400 when the %s", async (_label, body) => {
    const response = await injectSignupAppRequest()
      .post("/user/confirmOnboarding")
      .body(body);

    expect(response.statusCode).toBe(400);
    await expect(getAllSignupUsers()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    })
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(403);
    await expect(getAllSignupUsers()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the email is already associated", async () => {
    const existingUser = makeSignupUser({
      email: validConfirmOnboardingBody.email,
    });
    await seedSignupUser(existingUser);

    const response = await injectSignupAppRequest()
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllSignupUsers()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the fiscal number is already associated", async () => {
    const existingUser = makeSignupUser({
      fiscalNumber: validUISignupSessionTokenClaims.fiscalNumber,
    });
    await seedSignupUser(existingUser);

    const response = await injectSignupAppRequest()
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllSignupUsers()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the SPID code is already associated", async () => {
    const existingUser = makeSignupUser({
      spidCode: validUISignupSessionTokenClaims.spidCode,
    });
    await seedSignupUser(existingUser);

    const response = await injectSignupAppRequest()
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllSignupUsers()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the person identifier is already associated", async () => {
    const personIdentifier = "test-person-identifier";
    const existingUser = makeSignupUser({ personIdentifier });
    await seedSignupUser(existingUser);

    const response = await injectSignupAppRequest({
      fiscalNumber: null,
      oneIdNonce: validUISignupSessionTokenClaims.oneIdNonce,
      personIdentifier,
      spidCode: null,
      type: "ui-signup-session",
    })
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllSignupUsers()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 500 when the ui-signup-session token has no supported user identifier", async () => {
    const response = await injectSignupAppRequest({
      fiscalNumber: null,
      oneIdNonce: validUISignupSessionTokenClaims.oneIdNonce,
      personIdentifier: null,
      spidCode: null,
      type: "ui-signup-session",
    })
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(500);
    await expect(getAllSignupUsers()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });
});
