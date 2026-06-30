import { OnboardingCompletedV1 } from "@knodia/signup-models";
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
      fiscalNumber: null,
      lynxOrganizationName: expect.any(String),
      lynxUserName: expect.any(String),
      name: validUISignupSessionTokenClaims.name,
      orionOrganizationName: expect.any(String),
      orionUserName: expect.any(String),
      personIdentifier: null,
      signupUserId: expect.any(String),
      spidCode: validUISignupSessionTokenClaims.spidCode,
      status: "OnboardingPending",
      suspendedAt: null,
      suspensionReason: null,
      updatedAt: expect.any(Date),
    });

    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();
    const [sendPayload] = kafkaProducerMock.send.mock.calls[0] ?? [];

    expect(sendPayload).toEqual({
      messages: [{ key: signupUser?.signupUserId, value: expect.any(String) }],
      topic: "test-signup-topic",
    });

    const messageValue = sendPayload?.messages[0]?.value;
    expect(messageValue).toBeDefined();

    const event = OnboardingCompletedV1.parse(
      JSON.parse(messageValue as string),
    );

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
    const fiscalNumber = "RSSMRA80A01H501U";
    const existingUser = makeSignupUser({}, { fiscalNumber });
    await seedSignupUser(existingUser);

    const response = await injectSignupAppRequest({
      fiscalNumber,
      oneIdNonce: validUISignupSessionTokenClaims.oneIdNonce,
      personIdentifier: null,
      spidCode: null,
      type: "ui-signup-session",
    })
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllSignupUsers()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the SPID code is already associated", async () => {
    const existingUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
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
    const existingUser = makeSignupUser({}, { personIdentifier });
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

  it("rejects a ui-signup-session token that carries no identifier", async () => {
    // The single-identifier invariant lives in the token codec, so a token with
    // no identifier fails auth validation before reaching the handler (no user
    // is inserted). The test auth mock surfaces the rejection as a 500;
    // production returns 401.
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

describe("POST /user/confirmOnboarding — repeated request (publish retry)", () => {
  it("republishes for an existing OnboardingPending row instead of returning 409", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const pendingUser = makeSignupUser(
      {
        createdAt,
        email: validConfirmOnboardingBody.email,
        status: "OnboardingPending",
      },
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(pendingUser);

    const response = await injectSignupAppRequest()
      .post("/user/confirmOnboarding")
      .body(validConfirmOnboardingBody);

    expect(response.statusCode).toBe(204);

    const signupUsers = await getAllSignupUsers();
    expect(signupUsers).toHaveLength(1);
    expect(signupUsers.at(0)?.signupUserId).toBe(pendingUser.signupUserId);
    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();

    const messageValue =
      kafkaProducerMock.send.mock.calls[0]?.[0]?.messages[0]?.value;
    const event = OnboardingCompletedV1.parse(
      JSON.parse(messageValue as string),
    );

    expect(event.data.signupUserId).toBe(pendingUser.signupUserId);
    // occurredAt and digest derive from the stored createdAt (same as first attempt).
    expect(event.data.occurredAt).toBe(createdAt.toISOString());
    expect(event.data.termsAcceptanceDigest).toBe(
      computeTermsAcceptanceDigest(new Date(event.data.occurredAt)),
    );
  });
});
