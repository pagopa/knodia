/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  KeychainEventV1,
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockKnodeApiKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedKnodeApiKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const mockKnodeApiKeychain = getMockKnodeApiKeychain();

describe("DELETE /knodeApiKeychains/:KnodeApiKeychainId (deleteKnodeApiKeychain)", () => {
  it("should correctly create Knode API Keychain deletion event", async () => {
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const deleteResponse = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
    }).delete(`/knodeApiKeychains/${mockKnodeApiKeychain.id}`);

    expect(deleteResponse.statusCode).toBe(204);

    const events = await getAllKeychainEvents();

    const deletedEvent = events[1];

    expect(deletedEvent).toMatchObject({
      streamId: mockKnodeApiKeychain.id,
      type: "KnodeApiKeychainDeletedV1",
      version: 1,
    });

    const deletedEventData = KeychainEventV1.parse(deletedEvent).data;
    expect(deletedEventData).toMatchObject({
      knodeApiKeychain: toKnodeApiKeychainV1(mockKnodeApiKeychain),
    });
  });

  it("should return 403 if the organization is not the owner of the Knode API Keychain", async () => {
    const knodeApiKeychain: KnodeApiKeychain = {
      ...mockKnodeApiKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedKnodeApiKeychain(knodeApiKeychain);

    const deleteResponse = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/knodeApiKeychains/${knodeApiKeychain.id}`,
    );

    expect(deleteResponse.statusCode).toBe(403);
  });

  it("should return 404 if the Knode API Keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/knodeApiKeychains/${generateId()}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        `/knodeApiKeychains/${mockKnodeApiKeychain.id}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
