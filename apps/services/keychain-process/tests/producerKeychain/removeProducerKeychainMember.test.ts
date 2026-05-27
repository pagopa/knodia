/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  generateUserId,
  type OrganizationId,
  type ProducerKeychainId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
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

const memberId = generateUserId();
const mockProducerKeychain = getMockProducerKeychain();

async function removeProducerKeychainMember({
  producerKeychainId = mockProducerKeychain.id,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: mockProducerKeychain.ownerId,
    type: "ui-session",
  },
  userId = memberId,
}: {
  producerKeychainId?: ProducerKeychainId;
  token?: TestToken;
  userId?: UserId;
} = {}) {
  return await injectAppRequest(token).delete(
    `/producerKeychains/${producerKeychainId}/members/${userId}`,
  );
}

describe("DELETE /producerKeychains/:producerKeychainId/members/:userId (removeProducerKeychainMember)", () => {
  it("should correctly create producer keychain member removal event", async () => {
    const producerKeychain: ProducerKeychain = {
      ...mockProducerKeychain,
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedProducerKeychain(producerKeychain);

    const response = await removeProducerKeychainMember();

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    const removedEvent = events[1];

    expect(removedEvent).toMatchObject({
      streamId: producerKeychain.id,
      type: "ProducerKeychainMemberRemovedV1",
      version: 1,
    });

    const expectedProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      users: [],
    };

    expect(KeychainEventV1.parse(removedEvent).data).toMatchObject({
      producerKeychain: {
        ...toProducerKeychainV1(expectedProducerKeychain),
        updatedAt: expect.any(Number),
      },
      userId: memberId,
    });
  });

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const response = await removeProducerKeychainMember({
      token: {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
        type: "ui-session",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await removeProducerKeychainMember({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user is not a member", async () => {
    await seedProducerKeychain(mockProducerKeychain);

    const response = await removeProducerKeychainMember({
      userId: generateUserId(),
    });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await removeProducerKeychainMember({
        token: spec,
      });
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await removeProducerKeychainMember({
      producerKeychainId: "not-a-uuid" as never,
    });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 for invalid user id format", async () => {
    const response = await removeProducerKeychainMember({
      userId: "not-a-uuid" as never,
    });
    expect(response.statusCode).toBe(400);
  });
});
