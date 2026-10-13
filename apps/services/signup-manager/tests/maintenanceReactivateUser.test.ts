import { SignupEventV1 } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { kafkaProducerMock } from "./setup.ts";
import {
  getAllSignupUsers,
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

describe("POST /maintenance/users/:signupUserId/reactivate (maintenanceReactivateUser)", () => {
  it("should return 204 on successful reactivation request", async () => {
    const signupUser = makeSignupUser(
      {
        status: "Suspended",
        suspendedAt: new Date(),
        suspensionReason: "UnlawfulProcessing",
      },
      {
        spidCode: validUISignupSessionTokenClaims.spidCode,
      },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post(`/maintenance/users/${signupUser.signupUserId}/reactivate`);

    expect(response.statusCode).toBe(204);

    const signupUsers = await getAllSignupUsers();
    expect(signupUsers).toHaveLength(1);

    const reactivatedSignupUser = signupUsers[0];

    expect(reactivatedSignupUser).toEqual({
      createdAt: signupUser.createdAt,
      dateOfBirth: signupUser.dateOfBirth,
      email: signupUser.email,
      familyName: signupUser.familyName,
      fiscalNumber: signupUser.fiscalNumber ?? null,
      lynxOrganizationName: signupUser.generatedEntities.Lynx.organizationName,
      lynxUserName: signupUser.generatedEntities.Lynx.userName,
      name: signupUser.name,
      orionOrganizationName:
        signupUser.generatedEntities.Orion.organizationName,
      orionUserName: signupUser.generatedEntities.Orion.userName,
      signupUserId: signupUser.signupUserId,
      spidCode: signupUser.spidCode ?? null,
      status: "Active",
      suspendedAt: null,
      suspensionReason: null,
      termsAcceptedAt: signupUser.termsAcceptedAt,
      termsAcceptedVersion: signupUser.termsAcceptedVersion,
      updatedAt: expect.any(Date),
    });

    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();

    const [sendPayload] = kafkaProducerMock.send.mock.calls[0] ?? [];

    expect(sendPayload).toEqual({
      messages: [
        {
          key: signupUser.signupUserId,
          value: expect.any(String),
        },
      ],
      topic: "test-signup-topic",
    });

    const messageValue = sendPayload?.messages[0]?.value;
    expect(messageValue).toBeDefined();

    const event = SignupEventV1.parse(JSON.parse(messageValue as string));

    expect(event).toEqual({
      data: {
        occurredAt: expect.any(String),
        signupUserId: signupUser.signupUserId,
      },
      type: "MaintenanceUserReactivationRequestedV1",
    });
  });

  it("should not be rate limited for maintenance calls", async () => {
    for (let i = 0; i < 10; i++) {
      const response = await injectSignupAppRequest({
        type: "maintenance",
      }).post(
        "/maintenance/users/00000000-0000-0000-0000-000000000000/reactivate",
      );

      expect(response.statusCode).toBe(409);
    }

    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 400 when the signupUserId is not a valid UUID", async () => {
    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post("/maintenance/users/invalid-id/reactivate");

    expect(response.statusCode).toBe(400);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is not suspended", async () => {
    const signupUser = makeSignupUser(
      {
        status: "Active",
      },
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post(`/maintenance/users/${signupUser.signupUserId}/reactivate`);

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is in DeletionPending status", async () => {
    const signupUser = makeSignupUser(
      {
        status: "DeletionPending",
      },
      { spidCode: validUISignupSessionTokenClaims.spidCode },
    );
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post(`/maintenance/users/${signupUser.signupUserId}/reactivate`);

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 403 when the token is not a maintenance token", async () => {
    const signupUser = makeSignupUser({
      status: "Suspended",
      suspendedAt: new Date(),
      suspensionReason: "UnlawfulProcessing",
    });
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    }).post(`/maintenance/users/${signupUser.signupUserId}/reactivate`);

    expect(response.statusCode).toBe(403);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 409 when the signup user is not onboarded", async () => {
    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post(
      "/maintenance/users/00000000-0000-0000-0000-000000000000/reactivate",
    );

    expect(response.statusCode).toBe(409);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });
});
