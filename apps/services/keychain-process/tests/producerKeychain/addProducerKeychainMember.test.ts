/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
  type OrganizationId,
  type ProducerKeychainId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockProducerKeychain } from "@knodia/test-commons/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import type {
  API_CreatedMemberResource,
  API_KeychainMemberSeed,
} from "../../src/models/api.ts";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedProducerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const producerKeychain = getMockProducerKeychain();
const memberId = "10000000-1000-1000-8000-000000000011";
const memberUsername = "Mario Rossi";
const defaultBody: API_KeychainMemberSeed = {
  userId: memberId,
};

async function addProducerKeychainMember({
  producerKeychainId = producerKeychain.id,
  requestBody = defaultBody,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: producerKeychain.ownerId,
    type: "ui-session",
  },
}: {
  producerKeychainId?: ProducerKeychainId;
  requestBody?: API_KeychainMemberSeed;
  token?: TestToken;
} = {}) {
  return injectAppRequest(token)
    .post(`/producerKeychains/${producerKeychainId}/members`)
    .body(requestBody);
}

describe("POST /producerKeychains/:producerKeychainId/members (addProducerKeychainMember)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockReset();
  });

  it("should correctly create producer keychain update event when adding a member", async () => {
    await seedProducerKeychain(producerKeychain);

    cognitoIdmClientMock.getUserById.mockResolvedValue({
      email: "mario.rossi@example.com",
      id: memberId,
      roles: ["technical"],
      username: memberUsername,
    });
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockResolvedValue(true);

    const response = await addProducerKeychainMember();

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_CreatedMemberResource>();
    const expectedCreatedMember: API_CreatedMemberResource = {
      userId: memberId,
    };
    expect(responseBody).toEqual(expectedCreatedMember);

    const events = await getAllKeychainEvents();
    const addedEvent = events[1];

    expect(addedEvent).toMatchObject({
      streamId: producerKeychain.id,
      type: "ProducerKeychainMemberAddedV1",
      version: 1,
    });

    const producerKeychainV1 = toProducerKeychainV1(producerKeychain);
    expect(KeychainEventV1.parse(addedEvent).data).toMatchObject({
      producerKeychain: {
        ...producerKeychainV1,
        updatedAt: expect.any(Number),
        users: [
          ...producerKeychainV1.users,
          {
            addedAt: expect.any(Number),
            userId: unsafeBrandUserId(memberId),
          },
        ],
      },
      userId: memberId,
    });
  });

  it.each([
    ["invalid property", { invalidProperty: "invalid" }],
    ["userId is invalid", { userId: "not-a-uuid" }],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      await seedProducerKeychain(producerKeychain);

      const response = await addProducerKeychainMember({
        requestBody: body as never,
      });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    const ownedByAnotherOrganization: ProducerKeychain = {
      ...producerKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedProducerKeychain(ownedByAnotherOrganization);

    const response = await addProducerKeychainMember({
      producerKeychainId: ownedByAnotherOrganization.id,
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await addProducerKeychainMember({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user does not exist", async () => {
    await seedProducerKeychain(producerKeychain);

    const missingUserId = "10000000-1000-1000-8000-000000000099";

    cognitoIdmClientMock.getUserById.mockResolvedValue(undefined);

    const response = await addProducerKeychainMember({
      requestBody: { userId: missingUserId },
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user does not belong to the caller organization", async () => {
    await seedProducerKeychain(producerKeychain);

    cognitoIdmClientMock.getUserById.mockResolvedValue({
      email: "mario.rossi@example.com",
      id: memberId,
      roles: ["technical"],
      username: memberUsername,
    });
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockResolvedValue(
      false,
    );

    const response = await addProducerKeychainMember();

    expect(response.statusCode).toBe(404);
  });

  it("should return 409 if the user does not have the technical role", async () => {
    await seedProducerKeychain(producerKeychain);

    cognitoIdmClientMock.getUserById.mockResolvedValue({
      email: "mario.rossi@example.com",
      id: memberId,
      roles: ["administrative"],
      username: memberUsername,
    });
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockResolvedValue(true);

    const response = await addProducerKeychainMember();

    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if the user is already a member", async () => {
    const keychainWithExistingMember: ProducerKeychain = {
      ...producerKeychain,
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedProducerKeychain(keychainWithExistingMember);

    const response = await addProducerKeychainMember({
      producerKeychainId: keychainWithExistingMember.id,
    });

    expect(response.statusCode).toBe(409);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await addProducerKeychainMember({
        token: spec,
      });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await addProducerKeychainMember({
      producerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });
});
