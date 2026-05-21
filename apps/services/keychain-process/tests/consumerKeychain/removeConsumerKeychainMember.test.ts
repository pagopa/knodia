/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  generateUserId,
  type OrganizationId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Keychain } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const memberId = generateUserId();
const mockConsumerKeychain = getMockConsumerKeychain();

describe("DELETE /consumerKeychains/:consumerKeychainId/members/:userId (removeConsumerKeychainMember)", () => {
  it("should correctly create consumer keychain member removal event", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...mockConsumerKeychain,
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    }).delete(`/consumerKeychains/${consumerKeychain.id}/members/${memberId}`);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_Keychain>();
    const expectedConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      updatedAt: new Date(responseBody.updatedAt),
      users: [],
    };

    expect(responseBody).toEqual(toAPI_Keychain(expectedConsumerKeychain));

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainMemberRemovedV1",
      version: 1,
    });

    const removedEventData = KeychainEventV1.parse(removedEvent).data;
    expect(removedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
      userId: memberId,
    });
  });

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...mockConsumerKeychain,
      ownerId: generateId<OrganizationId>(),
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychains/${consumerKeychain.id}/members/${memberId}`,
    );

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychains/${generateId()}/members/${memberId}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user is not a member", async () => {
    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
    }).delete(
      `/consumerKeychains/${mockConsumerKeychain.id}/members/${memberId}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        `/consumerKeychains/${mockConsumerKeychain.id}/members/${memberId}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychains/not-a-uuid/members/${memberId}`,
    );
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid user id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychains/${mockConsumerKeychain.id}/members/not-a-uuid`,
    );
    expect(response.statusCode).toBe(400);
  });
});
