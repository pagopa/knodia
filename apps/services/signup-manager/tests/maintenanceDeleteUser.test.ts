import { SignupEventV1 } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { kafkaProducerMock } from "./setup.ts";
import {
  getAllSignupUsers,
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
} from "./utils.ts";

describe("POST /maintenance/users/:signupUserId/delete (maintenanceDeleteUser)", () => {
  it.each([{ status: "Active" as const }, { status: "Suspended" as const }])(
    "should return 204, mark the user DeletionPending and publish the maintenance deletion event for $status user",
    async ({ status }) => {
      const signupUser = makeSignupUser({ status });
      await seedSignupUser(signupUser);

      const response = await injectSignupAppRequest({
        type: "maintenance",
      }).post(`/maintenance/users/${signupUser.signupUserId}/delete`);

      expect(response.statusCode).toBe(204);

      const [row] = await getAllSignupUsers();
      expect(row).toMatchObject({
        signupUserId: signupUser.signupUserId,
        status: "DeletionPending",
      });

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
          signupUserId: signupUser.signupUserId,
        },
        type: "MaintenanceUserDeletionRequestedV1",
      });
    },
  );

  it("should return 400 when the signupUserId is not a valid UUID", async () => {
    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post("/maintenance/users/invalid-id/delete");

    expect(response.statusCode).toBe(400);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 404 when the signup user does not exist", async () => {
    const response = await injectSignupAppRequest({
      type: "maintenance",
    }).post("/maintenance/users/00000000-0000-0000-0000-000000000000/delete");

    expect(response.statusCode).toBe(404);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 403 when the token is not a maintenance token", async () => {
    const signupUser = makeSignupUser();
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    }).post(`/maintenance/users/${signupUser.signupUserId}/delete`);

    expect(response.statusCode).toBe(403);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should not be rate limited for maintenance calls", async () => {
    for (let i = 0; i < 10; i++) {
      const response = await injectSignupAppRequest({
        type: "maintenance",
      }).post("/maintenance/users/00000000-0000-0000-0000-000000000000/delete");

      expect(response.statusCode).toBe(404);
    }

    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });
});
