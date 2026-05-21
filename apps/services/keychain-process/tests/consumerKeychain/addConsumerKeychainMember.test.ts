/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
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
  seedConsumerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const consumerKeychain = getMockConsumerKeychain();

describe("POST /consumerKeychains/:consumerKeychainId/members (addKeychainMember)", () => {
  beforeEach(() => {
    cognitoIdmClientMock.getUserById.mockReset();
    cognitoIdmClientMock.checkUserBelongsToOrganization.mockReset();
  });

  it("should correctly create consumer keychain update event when adding a member", async () => {
    await seedConsumerKeychain(consumerKeychain);

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
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/members`)
      .body(body);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_Keychain>();
    const expectedConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      updatedAt: new Date(responseBody.updatedAt),
      users: [
        ...consumerKeychain.users,
        {
          addedAt: new Date(responseBody.updatedAt),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    expect(responseBody).toEqual(toAPI_Keychain(expectedConsumerKeychain));

    const events = await getAllKeychainEvents();
    const updatedEvent = events[1];

    expect(updatedEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainMemberAddedV1",
      version: 1,
    });

    const updatedEventData = KeychainEventV1.parse(updatedEvent).data;
    expect(updatedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
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
      await seedConsumerKeychain(consumerKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: consumerKeychain.ownerId,
        type: "ui-session",
      })
        .post(`/consumerKeychains/${consumerKeychain.id}/members`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const ownedByAnotherOrganization: ConsumerKeychain = {
      ...consumerKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedConsumerKeychain(ownedByAnotherOrganization);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${ownedByAnotherOrganization.id}/members`)
      .body({ userId: "10000000-1000-1000-8000-000000000011" });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${generateId()}/members`)
      .body({ userId: "10000000-1000-1000-8000-000000000011" });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user does not exist", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const missingUserId = "10000000-1000-1000-8000-000000000099";

    cognitoIdmClientMock.getUserById.mockResolvedValue(undefined);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/members`)
      .body({ userId: missingUserId });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the user does not belong to the caller organization", async () => {
    await seedConsumerKeychain(consumerKeychain);

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
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/members`)
      .body({ userId: memberId });

    expect(response.statusCode).toBe(404);
  });

  it("should return 409 if the user does not have the technical role", async () => {
    await seedConsumerKeychain(consumerKeychain);

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
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/members`)
      .body({ userId: memberId });

    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if the user is already a member", async () => {
    const memberId = "10000000-1000-1000-8000-000000000011";
    const keychainWithExistingMember: ConsumerKeychain = {
      ...consumerKeychain,
      users: [
        {
          addedAt: new Date(),
          userId: unsafeBrandUserId(memberId),
        },
      ],
    };

    await seedConsumerKeychain(keychainWithExistingMember);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: keychainWithExistingMember.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${keychainWithExistingMember.id}/members`)
      .body({ userId: memberId });

    expect(response.statusCode).toBe(409);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post(`/consumerKeychains/${consumerKeychain.id}/members`)
        .body({ userId: "10000000-1000-1000-8000-000000000011" });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/not-a-uuid/members`)
      .body({ userId: "10000000-1000-1000-8000-000000000011" });

    expect(response.statusCode).toBe(400);
  });
});
