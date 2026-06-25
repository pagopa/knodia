import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { DeletionRequestedV1 } from "@knodia/signup-models";
import { describe, expect, it } from "vitest";

import { kafkaProducerMock, signupDb } from "./setup.ts";
import {
  getAllSignupUsers,
  injectSignupAppRequest,
  makeSignupUser,
  seedSignupUser,
  validUISignupSessionTokenClaims,
} from "./utils.ts";

// occurredAt is the publish instant, so it differs between a publish and its
// retry; the event identity (key + type + the rest of data) is what stays stable.
function getPublishedEventIdentities() {
  return kafkaProducerMock.send.mock.calls.map(([payload]) => {
    const message = payload?.messages.at(0);
    const event = DeletionRequestedV1.parse(
      JSON.parse(message?.value as string),
    );
    return {
      key: message?.key,
      oneIdNonce: event.data.oneIdNonce,
      signupUserId: event.data.signupUserId,
      type: event.type,
    };
  });
}

function makeMatchingSignupUser(
  overrides: Parameters<typeof makeSignupUser>[0] = {},
) {
  return makeSignupUser(overrides, {
    spidCode: validUISignupSessionTokenClaims.spidCode,
  });
}

describe("POST /user/delete (deleteUser)", () => {
  it("should return 204, mark the user DeletionPending and publish the deletion event", async () => {
    const signupUser = makeMatchingSignupUser();
    await seedSignupUser(signupUser);

    const response = await injectSignupAppRequest().post("/user/delete");

    expect(response.statusCode).toBe(204);

    const [row] = await getAllSignupUsers();
    expect(row).toMatchObject({
      // PII stays intact while the deletion is pending
      email: signupUser.email,
      name: signupUser.name,
      signupUserId: signupUser.signupUserId,
      spidCode: signupUser.spidCode,
      status: "DeletionPending",
    });
    expect(row?.updatedAt.getTime()).toBeGreaterThan(
      signupUser.updatedAt.getTime(),
    );

    expect(kafkaProducerMock.send).toHaveBeenCalledOnce();
    const [sendPayload] = kafkaProducerMock.send.mock.calls[0] ?? [];
    expect(sendPayload).toEqual({
      messages: [{ key: signupUser.signupUserId, value: expect.any(String) }],
      topic: "test-signup-topic",
    });

    const event = DeletionRequestedV1.parse(
      JSON.parse(sendPayload?.messages.at(0)?.value as string),
    );
    expect(event).toEqual({
      data: {
        // No PII travels on Kafka; occurredAt is the publish instant
        occurredAt: expect.any(String),
        oneIdNonce: "test-nonce",
        signupUserId: signupUser.signupUserId,
      },
      type: "DeletionRequestedV1",
    });
  });

  it("should work from the Suspended status too", async () => {
    await seedSignupUser(makeMatchingSignupUser({ status: "Suspended" }));

    const response = await injectSignupAppRequest().post("/user/delete");

    expect(response.statusCode).toBe(204);
    const [row] = await getAllSignupUsers();
    expect(row?.status).toBe("DeletionPending");
  });

  it("should republish an event with the same identity on a repeated POST", async () => {
    await seedSignupUser(makeMatchingSignupUser());

    const firstResponse = await injectSignupAppRequest().post("/user/delete");
    const [rowAfterFirst] = await getAllSignupUsers();

    const secondResponse = await injectSignupAppRequest().post("/user/delete");
    const [rowAfterSecond] = await getAllSignupUsers();

    expect(firstResponse.statusCode).toBe(204);
    expect(secondResponse.statusCode).toBe(204);

    // The retry is an idempotent no-op on the row (no re-bump of updatedAt)
    expect(rowAfterSecond?.updatedAt).toEqual(rowAfterFirst?.updatedAt);
    // and republishes an event with the same key + identity (occurredAt aside)
    const [firstEvent, secondEvent] = getPublishedEventIdentities();
    expect(secondEvent).toEqual(firstEvent);
  });

  it("should return 500 on publish failure, keep the row DeletionPending and republish on retry", async () => {
    await seedSignupUser(makeMatchingSignupUser());
    kafkaProducerMock.send.mockRejectedValueOnce(new Error("kafka is down"));

    const failedResponse = await injectSignupAppRequest().post("/user/delete");

    expect(failedResponse.statusCode).toBe(500);
    const [row] = await getAllSignupUsers();
    expect(row?.status).toBe("DeletionPending");

    const retryResponse = await injectSignupAppRequest().post("/user/delete");

    expect(retryResponse.statusCode).toBe(204);
    const [failedEvent, retriedEvent] = getPublishedEventIdentities();
    expect(retriedEvent).toEqual(failedEvent);
  });

  it("should return 404 when no signup user matches the caller claims", async () => {
    const response = await injectSignupAppRequest().post("/user/delete");

    expect(response.statusCode).toBe(404);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 404 once the deletion has completed: the claims no longer match", async () => {
    const signupUser = makeMatchingSignupUser();
    await seedSignupUser(signupUser);
    const dbService = signupDbServiceBuilder(signupDb);
    await dbService.markSignupUserDeletionPending(signupUser.signupUserId);
    await dbService.completeSignupUserDeletion(signupUser.signupUserId);

    const response = await injectSignupAppRequest().post("/user/delete");

    expect(response.statusCode).toBe(404);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });

  it("should return 403 when the token is not a ui-signup-session token", async () => {
    const response = await injectSignupAppRequest({
      roles: ["administrative"],
      type: "ui-session",
    }).post("/user/delete");

    expect(response.statusCode).toBe(403);
    expect(kafkaProducerMock.send).not.toHaveBeenCalled();
  });
});
