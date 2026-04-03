/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  type OrganizationId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  type ConsumerKeychainKey,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
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
  { roles: ["technical"], type: "ui-session" },
];

const existingKey: ConsumerKeychainKey = {
  ...getMockConsumerKeychainKey(0),
  userId: unsafeBrandUserId(TEST_ORGANIZATION_ID),
};

const keyId = existingKey.kid;

describe("DELETE /consumerKeychains/:consumerKeychainId/keys/:keyId (removeConsumerKeychainKey)", () => {
  it("should correctly create consumer keychain key removal event", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...getMockConsumerKeychain(),
      keys: [existingKey],
      users: [unsafeBrandUserId(TEST_ORGANIZATION_ID)],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    }).delete(`/consumerKeychains/${consumerKeychain.id}/keys/${keyId}`);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainKeyRemovedV1",
      version: 1,
    });

    const removedEventData = KeychainEventV1.parse(removedEvent).data;
    const expectedConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      keys: [],
      updatedAt: new Date(removedEventData.consumerKeychain!.updatedAt),
    };

    expect(removedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
      kid: keyId,
    });
  });

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...getMockConsumerKeychain(),
      keys: [existingKey],
      ownerId: generateId<OrganizationId>(),
      users: [unsafeBrandUserId(TEST_ORGANIZATION_ID)],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
    }).delete(`/consumerKeychains/${consumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
    }).delete(`/consumerKeychains/${generateId()}/keys/${keyId}`);

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the caller is not a member of the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...getMockConsumerKeychain(),
      keys: [existingKey],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    }).delete(`/consumerKeychains/${consumerKeychain.id}/keys/${keyId}`);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the key is not in the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...getMockConsumerKeychain(),
      users: [unsafeBrandUserId(TEST_ORGANIZATION_ID)],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
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
