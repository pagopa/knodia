/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  generateUserId,
  type OrganizationId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockKnodeApiKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Keychain } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedKnodeApiKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const memberId = generateUserId();
const mockKnodeApiKeychain = getMockKnodeApiKeychain();

describe("DELETE /knodeApiKeychains/:knodeApiKeychainId/members/:userId (removeKnodeApiKeychainMember)", () => {
  it("should correctly create Knode API keychain member removal event", async () => {
    const knodeApiKeychain: KnodeApiKeychain = {
      ...mockKnodeApiKeychain,
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    }).delete(`/knodeApiKeychains/${knodeApiKeychain.id}/members/${memberId}`);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_Keychain>();
    const expectedKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      updatedAt: new Date(responseBody.updatedAt),
      users: [],
    };

    expect(responseBody).toEqual(toAPI_Keychain(expectedKnodeApiKeychain));

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: knodeApiKeychain.id,
      type: "KnodeApiKeychainMemberRemovedV1",
      version: 1,
    });

    const removedEventData = KeychainEventV1.parse(removedEvent).data;
    expect(removedEventData).toMatchObject({
      knodeApiKeychain: toKnodeApiKeychainV1(expectedKnodeApiKeychain),
      userId: memberId,
    });
  });

  it("should return 403 if the organization is not the owner of the Knode API keychain", async () => {
    const knodeApiKeychain: KnodeApiKeychain = {
      ...mockKnodeApiKeychain,
      ownerId: generateId<OrganizationId>(),
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/knodeApiKeychains/${knodeApiKeychain.id}/members/${memberId}`,
    );

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the Knode API keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/knodeApiKeychains/${generateId()}/members/${memberId}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user is not a member", async () => {
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
    }).delete(
      `/knodeApiKeychains/${mockKnodeApiKeychain.id}/members/${memberId}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        `/knodeApiKeychains/${mockKnodeApiKeychain.id}/members/${memberId}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
