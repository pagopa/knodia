/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  type ConsumerKeychain,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const mockConsumerKeychain = getMockConsumerKeychain();

describe("DELETE /consumerKeychains/:consumerKeychainId (deleteConsumerKeychain)", () => {
  it("should correctly create consumer keychain deletion event", async () => {
    await seedConsumerKeychain(mockConsumerKeychain);

    const deleteResponse = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
    }).delete(`/consumerKeychains/${mockConsumerKeychain.id}`);

    expect(deleteResponse.statusCode).toBe(204);

    const events = await getAllKeychainEvents();

    const deletedEvent = events[1];

    expect(deletedEvent).toMatchObject({
      streamId: mockConsumerKeychain.id,
      type: "ConsumerKeychainDeletedV1",
      version: 1,
    });

    const deletedEventData = KeychainEventV1.parse(deletedEvent).data;
    expect(deletedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(mockConsumerKeychain),
    });
  });

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...mockConsumerKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedConsumerKeychain(consumerKeychain);

    const deleteResponse = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychains/${consumerKeychain.id}`,
    );

    expect(deleteResponse.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychains/${generateId()}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        `/consumerKeychains/${mockConsumerKeychain.id}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
