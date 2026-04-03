/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { API_UnlinkConsumerKeychainPurposeQueryParams } from "@knodia/keychain-models/api";

import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  type KnodeId,
  type OrganizationId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { assert, beforeEach, describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
  seedConsumerKeychainPurpose,
  toExpectConsumerKeychainV1,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("DELETE /consumerKeychains/:consumerKeychainId/purposes/:purposeId (unlinkPurposeFromConsumerKeychain)", () => {
  const knodeId: KnodeId = "Orion";
  const consumerKeychain: ConsumerKeychain = {
    ...getMockConsumerKeychain(),
    ownerId: TEST_ORGANIZATION_ID,
  };
  const purposeId = generateExternalId<PurposeId>();
  const consumerKeychainPurpose: ConsumerKeychainPurpose = {
    consumerKeychainId: consumerKeychain.id,
    linkedAt: new Date(),
    purpose: {
      id: purposeId,
      knodeId,
    },
  };

  const query: API_UnlinkConsumerKeychainPurposeQueryParams = {
    knodeId,
  };

  beforeEach(async () => {
    await seedConsumerKeychain(consumerKeychain);
    await seedConsumerKeychainPurpose(
      consumerKeychain,
      consumerKeychainPurpose,
    );
  });

  it("should correctly create consumer keychain purpose unlink event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .delete(`/consumerKeychains/${consumerKeychain.id}/purposes/${purposeId}`)
      .query(query);

    expect(response.statusCode).toBe(204);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("2");

    const events = await getAllKeychainEvents();
    const unlinkEvent = events[2];

    expect(unlinkEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainPurposeUnlinkedV1",
      version: 2,
    });

    const parsedEvent = KeychainEventV1.parse(unlinkEvent);
    assert(parsedEvent.type === "ConsumerKeychainPurposeUnlinkedV1");

    const unlinkEventData = parsedEvent.data;

    expect(unlinkEventData).toMatchObject({
      consumerKeychain: toExpectConsumerKeychainV1(
        toConsumerKeychainV1(consumerKeychain),
      ),
      purpose: consumerKeychainPurpose.purpose,
    });
  });

  it.each([
    ["invalid property", { ...query, wrongProperty: "wrong" }],
    ["invalid knode id", { ...query, knodeId: "InvalidKnodeId" }],
    ["empty query", {}],
  ])(
    "should return 400 if the query is not correctly formatted - %s",
    async (_label, requestQuery) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .delete(
          `/consumerKeychains/${consumerKeychain.id}/purposes/${purposeId}`,
        )
        .query(requestQuery as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .delete(
          `/consumerKeychains/${consumerKeychain.id}/purposes/${purposeId}`,
        )
        .query(query);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .delete(`/consumerKeychains/${generateId()}/purposes/${purposeId}`)
      .query(query);
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the purpose is not linked to the consumer keychain", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .delete(
        `/consumerKeychains/${consumerKeychain.id}/purposes/${generateId()}`,
      )
      .query(query);
    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the requester is not the consumer keychain owner", async () => {
    const response = await injectAppRequest({
      organizationId: generateId<OrganizationId>(),
      roles: ["administrative"],
      type: "ui-session",
    })
      .delete(`/consumerKeychains/${consumerKeychain.id}/purposes/${purposeId}`)
      .query(query);
    expect(response.statusCode).toBe(403);
  });
});
