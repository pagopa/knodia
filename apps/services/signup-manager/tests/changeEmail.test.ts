import { SignupEventV1 } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { kafkaProducerMock } from "./setup.ts";
import {
  getAllEmailChangeRequests,
  injectSignupAppRequest,
  makeEmailChangeRequest,
  makeSignupUser,
  seedEmailChangeRequest,
  seedSignupUser,
  validChangeEmailBody,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

describe("POST /user/changeEmail (changeEmail)", () => {
  it("should return 204 on successful email change request", async () => {
    const signupUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(204);

    const emailChangeRequests = await getAllEmailChangeRequests();
    expect(emailChangeRequests).toHaveLength(1);

    const emailChangeRequest = emailChangeRequests[0];

    expect(emailChangeRequest).toEqual({
      createdAt: expect.any(Date),
      email: validChangeEmailBody.email,
      emailChangeRequestId: expect.any(String),
      signupUserId: signupUser.signupUserId,
    });

    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();
    const [sendPayload] = kafkaProducerMock.send.mock.calls[0] ?? [];

    expect(sendPayload).toEqual({
      messages: [{ key: signupUser.signupUserId, value: expect.any(String) }],
      topic: "test-signup-topic",
    });

    const messageValue = sendPayload?.messages[0]?.value;
    expect(messageValue).toBeDefined();

    const event = SignupEventV1.parse(JSON.parse(messageValue as string));

    expect(event).toEqual({
      data: {
        emailChangeRequestId: emailChangeRequest?.emailChangeRequestId,
        signupUserId: signupUser.signupUserId,
      },
      type: "EmailChangeRequestedV1",
    });
  });

  it.each([
    ["email is missing", {}],
    ["email is not valid", { email: "not-an-email" }],
    [
      "body contains unexpected properties",
      { ...validChangeEmailBody, unexpectedProperty: "unexpected" },
    ],
  ])("should return 400 when the %s", async (_label, body) => {
    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(body);

    expect(response.statusCode).toBe(400);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    })
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(403);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return a generic 403 when the new email domain is not in the allowlist", async () => {
    const signupUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body({ email: "nuova@knodia.com" });

    expect(response.statusCode).toBe(403);

    const problem = response.json();
    expect(problem.errors?.[0]?.code).toBe("011-0010");
    const serialized = JSON.stringify(problem).toLowerCase();
    expect(serialized).not.toContain("domain");
    expect(serialized).not.toContain("knodia");

    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is not onboarded", async () => {
    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is still OnboardingPending", async () => {
    await seedSignupUser(
      makeSignupUser(
        {
          status: "OnboardingPending",
        },
        { spidCode: validUISignupSessionTokenClaims.spidCode },
      ),
    );

    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the email is already associated", async () => {
    const signupUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    const existingUser = makeSignupUser({
      email: validChangeEmailBody.email,
    });
    await seedSignupUser(signupUser);
    await seedSignupUser(existingUser);

    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(0);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the email already has a pending change request", async () => {
    const signupUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    const pendingRequestUser = makeSignupUser();
    await seedSignupUser(signupUser);
    await seedSignupUser(pendingRequestUser);
    await seedEmailChangeRequest(
      makeEmailChangeRequest({
        email: validChangeEmailBody.email,
        signupUserId: pendingRequestUser.signupUserId,
      }),
    );

    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user already has a pending change request", async () => {
    const signupUser = makeSignupUser(
      {},
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);
    await seedEmailChangeRequest(
      makeEmailChangeRequest({ signupUserId: signupUser.signupUserId }),
    );

    const response = await injectSignupAppRequest()
      .post("/user/changeEmail")
      .body(validChangeEmailBody);

    expect(response.statusCode).toBe(409);
    await expect(getAllEmailChangeRequests()).resolves.toHaveLength(1);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });
});
