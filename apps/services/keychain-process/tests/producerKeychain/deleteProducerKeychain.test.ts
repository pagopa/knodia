/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, type ProducerKeychainId } from "@knodia/common-models/ids";
import {
  KeychainEventV1,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockProducerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedProducerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const mockProducerKeychain = getMockProducerKeychain();

async function deleteProducerKeychain({
  producerKeychainId = mockProducerKeychain.id,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: mockProducerKeychain.ownerId,
    type: "ui-session",
  },
}: {
  producerKeychainId?: ProducerKeychainId;
  token?: TestToken;
} = {}) {
  return await injectAppRequest(token).delete(
    `/producerKeychains/${producerKeychainId}`,
  );
}

describe("DELETE /producerKeychains/:producerKeychainId (deleteProducerKeychain)", () => {
  it("should correctly create producer keychain deletion event", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const deleteResponse = await deleteProducerKeychain();

    expect(deleteResponse.statusCode).toBe(204);

    const events = await getAllKeychainEvents();

    const deletedEvent = events[1];

    expect(deletedEvent).toMatchObject({
      streamId: mockProducerKeychain.id,
      type: "ProducerKeychainDeletedV1",
      version: 1,
    });

    const deletedEventData = KeychainEventV1.parse(deletedEvent).data;
    expect(deletedEventData).toMatchObject({
      producerKeychain: toProducerKeychainV1(mockProducerKeychain),
    });
  });

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    const producerKeychain: ProducerKeychain = {
      ...mockProducerKeychain,
      ownerId: generateId(),
    };

    await seedProducerKeychain(producerKeychain);

    const deleteResponse = await deleteProducerKeychain({
      token: {
        ...allowedTestTokens[0]!,
        organizationId: generateId(),
        type: "ui-session",
      },
    });

    expect(deleteResponse.statusCode).toBe(403);
  });

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await deleteProducerKeychain({
      producerKeychainId: generateId(),
    });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await deleteProducerKeychain({
        token: spec,
      });
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await deleteProducerKeychain({
      producerKeychainId: "not-a-uuid" as never,
    });
    expect(response.statusCode).toBe(400);
  });
});
