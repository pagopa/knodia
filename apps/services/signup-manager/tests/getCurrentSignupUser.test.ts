import { generateId } from "@knodia/common-models/ids";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { SignupUserStatus, SuspensionReason } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { app, signupDb } from "./setup.ts";
import {
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

describe("GET /user/me (getCurrentSignupUser)", () => {
  it("should return NOT_COMPLETED when the signup user does not exist", async () => {
    const response = await injectSignupAppRequest().get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      onboardingStatus: "NOT_COMPLETED",
    });
  });

  it("should return ACTIVE with email when the signup user exists", async () => {
    const signupUser = makeSignupUser(
      {
        email: "onboarded.user@example.com",
        status: SignupUserStatus.enum.Active,
      },
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      email: signupUser.email,
      onboardingStatus: "ACTIVE",
    });
  });

  it("should return SUSPENDED with email when the signup user is suspended", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00.000Z");
    const signupUser = makeSignupUser(
      {
        email: "suspended.user@example.com",
        status: SignupUserStatus.enum.Suspended,
        suspendedAt,
        suspensionReason: SuspensionReason.enum.UnlawfulProcessing,
      },
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      email: signupUser.email,
      onboardingStatus: "SUSPENDED",
    });
  });

  it("should return DELETION_PENDING with email when the user deletion is pending", async () => {
    const signupUser = makeSignupUser(
      {
        email: "deletion.pending.user@example.com",
        status: SignupUserStatus.enum.DeletionPending,
      },
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      email: signupUser.email,
      onboardingStatus: "DELETION_PENDING",
    });
  });

  it("should return NOT_COMPLETED when the user deletion has completed", async () => {
    const signupUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);
    const dbService = signupDbServiceBuilder(signupDb);
    await dbService.markSignupUserDeletionPending(signupUser.signupUserId);
    await dbService.completeSignupUserDeletion(signupUser.signupUserId);

    const response = await injectSignupAppRequest().get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      onboardingStatus: "NOT_COMPLETED",
    });
  });

  it("should match the signup user by person identifier", async () => {
    const personIdentifier = "test-person-identifier";
    const signupUser = makeSignupUser(
      { email: "person.identifier.user@example.com" },
      { personIdentifier },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      fiscalNumber: null,
      oneIdNonce: "test-nonce",
      personIdentifier,
      spidCode: null,
      type: "ui-signup-session",
    }).get("/user/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      email: signupUser.email,
      onboardingStatus: "ACTIVE",
    });
  });

  it("should return 401 when the Authorization header is missing", async () => {
    const response = await app
      .inject()
      .headers({ "x-correlation-id": generateId() })
      .get("/user/me");

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    }).get("/user/me");

    expect(response.statusCode).toBe(403);
  });
});
