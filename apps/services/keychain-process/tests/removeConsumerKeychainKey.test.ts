/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  generateUserId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import {
  type ConsumerKeychain,
  type ConsumerKeychainKey,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockConsumerKeychainKey,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];
const callerUserId = generateUserId();

const existingKey: ConsumerKeychainKey = {
  ...getMockConsumerKeychainKey(0),
  userId: callerUserId,
};

const keyId = existingKey.kid;

const mockConsumerKeychain: ConsumerKeychain = {
  ...getMockConsumerKeychain(),
  keys: [existingKey],
  users: [
    {
      addedAt: new Date(),
      userId: callerUserId,
    },
  ],
};

describe("DELETE /consumerKeychains/:consumerKeychainId/keys/:keyId (removeConsumerKeychainKey)", () => {
  it("should correctly create consumer keychain key removal event for a technical member", async () => {
    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/consumerKeychains/${mockConsumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: mockConsumerKeychain.id,
      type: "ConsumerKeychainKeyRemovedV1",
      version: 1,
    });

    const removedEventData = KeychainEventV1.parse(removedEvent).data;
    const expectedConsumerKeychain: ConsumerKeychain = {
      ...mockConsumerKeychain,
      keys: [],
      updatedAt: new Date(removedEventData.consumerKeychain!.updatedAt),
    };

    expect(removedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
      kid: keyId,
    });
  });

  it("should allow an administrative user to remove a key even if not a keychain member", async () => {
    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
      userId: generateUserId(),
    }).delete(`/consumerKeychains/${mockConsumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: mockConsumerKeychain.id,
      type: "ConsumerKeychainKeyRemovedV1",
      version: 1,
    });
  });

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: generateId<OrganizationId>(),
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/consumerKeychains/${mockConsumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/consumerKeychains/${generateId()}/keys/${keyId}`);

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if a technical caller is not a member of the consumer keychain", async () => {
    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
      userId: generateUserId(),
    }).delete(`/consumerKeychains/${mockConsumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the key is not in the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...mockConsumerKeychain,
      keys: [],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/consumerKeychains/${consumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).delete(
        `/consumerKeychains/${generateId()}/keys/${keyId}`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
