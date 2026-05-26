/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  generateUserId,
  type KeyId,
  type OrganizationId,
  type ProducerKeychainId,
} from "@knodia/common-models/ids";
import {
  KeychainEventV1,
  type KeychainKey,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedProducerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];
const callerUserId = generateUserId();

const existingKey: KeychainKey = {
  ...getMockKeychainKey(0),
  userId: callerUserId,
};

const keyId = existingKey.kid;

const mockProducerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  keys: [existingKey],
  users: [
    {
      addedAt: new Date(),
      userId: callerUserId,
    },
  ],
};

async function removeProducerKeychainKey({
  keyId = existingKey.kid,
  producerKeychainId = mockProducerKeychain.id,
  token = {
    ...allowedTestTokens[1]!,
    organizationId: mockProducerKeychain.ownerId,
    type: "ui-session",
    userId: callerUserId,
  },
}: {
  keyId?: KeyId;
  producerKeychainId?: ProducerKeychainId;
  token?: TestToken;
} = {}) {
  return await injectAppRequest(token).delete(
    `/producerKeychains/${producerKeychainId}/keys/${keyId}`,
  );
}

describe("DELETE /producerKeychains/:producerKeychainId/keys/:keyId (removeProducerKeychainKey)", () => {
  it("should correctly create producer keychain key removal event for a technical member", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const response = await removeProducerKeychainKey();

    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: mockProducerKeychain.id,
      type: "ProducerKeychainKeyRemovedV1",
      version: 1,
    });

    const expectedProducerKeychain: ProducerKeychain = {
      ...mockProducerKeychain,
      keys: [],
    };

    expect(KeychainEventV1.parse(removedEvent)).toMatchObject({
      data: {
        kid: keyId,
        producerKeychain: {
          ...toProducerKeychainV1(expectedProducerKeychain),
          updatedAt: expect.any(Number),
        },
      },
      type: "ProducerKeychainKeyRemovedV1",
    });
  });

  it("should allow an administrative user to remove a key even if not a keychain member", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const response = await removeProducerKeychainKey({
      token: {
        ...allowedTestTokens[0]!,
        organizationId: mockProducerKeychain.ownerId,
        type: "ui-session",
        userId: generateUserId(),
      },
    });

    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: mockProducerKeychain.id,
      type: "ProducerKeychainKeyRemovedV1",
      version: 1,
    });
  });

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const response = await removeProducerKeychainKey({
      token: {
        ...allowedTestTokens[1]!,
        organizationId: generateId<OrganizationId>(),
        type: "ui-session",
        userId: callerUserId,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await removeProducerKeychainKey({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if a technical caller is not a member of the producer keychain", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const response = await removeProducerKeychainKey({
      token: {
        ...allowedTestTokens[1]!,
        organizationId: mockProducerKeychain.ownerId,
        type: "ui-session",
        userId: generateUserId(),
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the key is not in the producer keychain", async () => {
    const producerKeychain: ProducerKeychain = {
      ...mockProducerKeychain,
      keys: [],
    };

    await seedProducerKeychain(producerKeychain);

    const response = await removeProducerKeychainKey({
      producerKeychainId: producerKeychain.id,
    });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await removeProducerKeychainKey({ token });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await removeProducerKeychainKey({
      producerKeychainId: "not-a-uuid" as never,
    });
    expect(response.statusCode).toBe(400);
  });
});
