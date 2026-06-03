import { generateId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { app } from "./setup.ts";
import {
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

describe("GET /me (getCurrentSignupUser)", () => {
  it("should return NOT_COMPLETED when the signup user does not exist", async () => {
    const response = await injectSignupAppRequest().get("/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      onboardingStatus: "NOT_COMPLETED",
    });
  });

  it("should return ACTIVE with email when the signup user exists", async () => {
    const signupUser = makeSignupUser({
      email: "onboarded.user@example.com",
      fiscalNumber: validUISignupSessionTokenClaims.fiscalNumber,
      spidCode: validUISignupSessionTokenClaims.spidCode,
      status: "ACTIVE",
    });
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().get("/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      email: signupUser.email,
      onboardingStatus: "ACTIVE",
    });
  });

  it("should return SUSPENDED with email when the signup user is suspended", async () => {
    const signupUser = makeSignupUser({
      email: "suspended.user@example.com",
      fiscalNumber: validUISignupSessionTokenClaims.fiscalNumber,
      spidCode: validUISignupSessionTokenClaims.spidCode,
      status: "SUSPENDED",
    });
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().get("/me");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      email: signupUser.email,
      onboardingStatus: "SUSPENDED",
    });
  });

  it("should match the signup user by person identifier", async () => {
    const personIdentifier = "test-person-identifier";
    const signupUser = makeSignupUser({
      email: "person.identifier.user@example.com",
      fiscalNumber: undefined,
      personIdentifier,
      spidCode: undefined,
    });
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      fiscalNumber: null,
      personIdentifier,
      spidCode: null,
      type: "ui-signup-session",
    }).get("/me");

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
      .get("/me");

    expect(response.statusCode).toBe(401);
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    }).get("/me");

    expect(response.statusCode).toBe(403);
  });
});
