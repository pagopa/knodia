/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
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
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cognitoIdmClientMock,
  cognitoIdmClientModuleMock,
} from "../cognitoIdmClientMock.ts";

vi.mock("@knodia/cognito-idm-client", () => cognitoIdmClientModuleMock);

import type {
  API_Keychain,
  API_KeychainMemberSeed,
} from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedKnodeApiKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const knodeApiKeychain = getMockKnodeApiKeychain();

describe("POST /knodeApiKeychains/:knodeApiKeychainId/members (addKnodeApiKeychainMember)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockReset();
  });

  it("should correctly create Knode API keychain member added event when adding a member", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const memberId = "10000000-1000-1000-8000-000000000011";
    const memberUsername = "Mario Rossi";
    const body: API_KeychainMemberSeed = {
      userId: memberId,
    };

    cognitoIdmClientMock.getUserById.mockResolvedValue({
      email: "mario.rossi@example.com",
      id: memberId,
      roles: ["technical"],
      username: memberUsername,
    });
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockResolvedValue(true);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/members`)
      .body(body);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_Keychain>();
    const expectedKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      updatedAt: new Date(responseBody.updatedAt),
      users: [
        ...knodeApiKeychain.users,
        {
          addedAt: new Date(responseBody.updatedAt),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    expect(responseBody).toEqual(toAPI_Keychain(expectedKnodeApiKeychain));

    const events = await getAllKeychainEvents();
    const addedEvent = events[1];

    expect(addedEvent).toMatchObject({
      streamId: knodeApiKeychain.id,
      type: "KnodeApiKeychainMemberAddedV1",
      version: 1,
    });

    const addedEventData = KeychainEventV1.parse(addedEvent).data;
    expect(addedEventData).toMatchObject({
      knodeApiKeychain: toKnodeApiKeychainV1(expectedKnodeApiKeychain),
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
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: knodeApiKeychain.ownerId,
        type: "ui-session",
      })
        .post(`/knodeApiKeychains/${knodeApiKeychain.id}/members`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the Knode API keychain", async () => {
    const ownedByAnotherOrganization: KnodeApiKeychain = {
      ...knodeApiKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedKnodeApiKeychain(ownedByAnotherOrganization);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/knodeApiKeychains/${ownedByAnotherOrganization.id}/members`)
      .body({ userId: "10000000-1000-1000-8000-000000000011" });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the Knode API keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/knodeApiKeychains/${generateId()}/members`)
      .body({ userId: "10000000-1000-1000-8000-000000000011" });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user does not exist", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const missingUserId = "10000000-1000-1000-8000-000000000099";

    cognitoIdmClientMock.getUserById.mockResolvedValue(undefined);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/members`)
      .body({ userId: missingUserId });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user does not belong to the caller organization", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const memberId = "10000000-1000-1000-8000-000000000011";
    const memberUsername = "Mario Rossi";

    cognitoIdmClientMock.getUserById.mockResolvedValue({
      email: "mario.rossi@example.com",
      id: memberId,
      roles: ["technical"],
      username: memberUsername,
    });
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockResolvedValue(
      false,
    );

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/members`)
      .body({ userId: memberId });

    expect(response.statusCode).toBe(404);
  });

  it("should return 409 if the user does not have the technical role", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const memberId = "10000000-1000-1000-8000-000000000011";
    const memberUsername = "Mario Rossi";

    cognitoIdmClientMock.getUserById.mockResolvedValue({
      email: "mario.rossi@example.com",
      id: memberId,
      roles: ["administrative"],
      username: memberUsername,
    });
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockResolvedValue(true);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/members`)
      .body({ userId: memberId });

    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if the user is already a member", async () => {
    const memberId = "10000000-1000-1000-8000-000000000011";
    const keychainWithExistingMember: KnodeApiKeychain = {
      ...knodeApiKeychain,
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedKnodeApiKeychain(keychainWithExistingMember);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: keychainWithExistingMember.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${keychainWithExistingMember.id}/members`)
      .body({ userId: memberId });

    expect(response.statusCode).toBe(409);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post(`/knodeApiKeychains/${knodeApiKeychain.id}/members`)
        .body({ userId: "10000000-1000-1000-8000-000000000011" });

      expect(response.statusCode).toBe(403);
    },
  );
});
