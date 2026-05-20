/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  generateUserId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import {
  KeychainEventV1,
  type KeychainKey,
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedKnodeApiKeychain,
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

const mockKnodeApiKeychain: KnodeApiKeychain = {
  ...getMockKnodeApiKeychain(),
  keys: [existingKey],
  users: [
    {
      addedAt: new Date(),
      userId: callerUserId,
    },
  ],
};

describe("DELETE /knodeApiKeychains/:knodeApiKeychainId/keys/:keyId (removeKnodeApiKeychainKey)", () => {
  it("should correctly create Knode API keychain key removal event for a technical member", async () => {
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: mockKnodeApiKeychain.id,
      type: "KnodeApiKeychainKeyRemovedV1",
      version: 1,
    });

    const parsedRemovedEvent = KeychainEventV1.parse(removedEvent);
    if (parsedRemovedEvent.type !== "KnodeApiKeychainKeyRemovedV1") {
      throw new Error(`Unexpected event type: ${parsedRemovedEvent.type}`);
    }
    const removedEventData = parsedRemovedEvent.data;
    const expectedKnodeApiKeychain: KnodeApiKeychain = {
      ...mockKnodeApiKeychain,
      keys: [],
      updatedAt: new Date(removedEventData.knodeApiKeychain!.updatedAt),
    };

    expect(removedEventData).toMatchObject({
      kid: keyId,
      knodeApiKeychain: toKnodeApiKeychainV1(expectedKnodeApiKeychain),
    });
  });

  it("should allow an administrative user to remove a key even if not a keychain member", async () => {
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
      userId: generateUserId(),
    }).delete(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: mockKnodeApiKeychain.id,
      type: "KnodeApiKeychainKeyRemovedV1",
      version: 1,
    });
  });

  it("should return 403 if the organization is not the owner of the Knode API keychain", async () => {
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: generateId<OrganizationId>(),
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the Knode API keychain does not exist", async () => {
    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/knodeApiKeychains/${generateId()}/keys/${keyId}`);

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if a technical caller is not a member of the Knode API keychain", async () => {
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
      userId: generateUserId(),
    }).delete(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the key is not in the Knode API keychain", async () => {
    const knodeApiKeychain: KnodeApiKeychain = {
      ...mockKnodeApiKeychain,
      keys: [],
    };

    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[1]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
      userId: callerUserId,
    }).delete(`/knodeApiKeychains/${knodeApiKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token).delete(
        `/knodeApiKeychains/${generateId()}/keys/${keyId}`,
      );

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid Knode API keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/knodeApiKeychains/not-a-uuid/keys/${keyId}`,
    );
    expect(response.statusCode).toBe(400);
  });
});
