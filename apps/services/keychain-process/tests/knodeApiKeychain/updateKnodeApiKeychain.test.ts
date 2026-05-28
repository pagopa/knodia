/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockKnodeApiKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Keychain, API_KeychainPatch } from "../../src/models/api.ts";

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

describe("PATCH /knodeApiKeychains/:knodeApiKeychainId (KnodeApiKeychainPatch)", () => {
  it.each([
    {
      body: {
        description: { en: "Updated Knode API keychain description" },
        name: { en: "Updated Knode API keychain name" },
      },
    },
    {
      body: {},
    },
    {
      body: {
        description: null,
      },
    },
    {
      body: {
        name: { en: "Updated Knode API keychain name" },
      },
    },
    {
      body: {
        description: { en: "Updated Knode API keychain description" },
      },
    },
  ] satisfies { body: API_KeychainPatch }[])(
    "should correctly create Knode API keychain update event with body %S",
    async ({ body }) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: knodeApiKeychain.ownerId,
        type: "ui-session",
      })
        .patch(`/knodeApiKeychains/${knodeApiKeychain.id}`)
        .body(body);

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
      expect(response.statusCode).toBe(200);

      const responseBody = response.json<API_Keychain>();
      const expectedKnodeApiKeychain: KnodeApiKeychain = {
        ...knodeApiKeychain,
        description:
          body.description === null
            ? undefined
            : (body.description ?? knodeApiKeychain.description),
        name: body.name ?? knodeApiKeychain.name,
        updatedAt: new Date(responseBody.updatedAt),
      };

      expect(responseBody).toEqual(toAPI_Keychain(expectedKnodeApiKeychain));

      const events = await getAllKeychainEvents();

      const updatedEvent = events.filter(
        (e) => e.streamId === knodeApiKeychain.id,
      )[1];

      expect(updatedEvent).toMatchObject({
        streamId: knodeApiKeychain.id,
        type: "KnodeApiKeychainUpdatedV1",
        version: 1,
      });

      const updatedEventData = KeychainEventV1.parse(updatedEvent).data;
      expect(updatedEventData).toMatchObject({
        knodeApiKeychain: toKnodeApiKeychainV1(expectedKnodeApiKeychain),
      });
    },
  );

  it.each([
    ["invalid property", { invalidProperty: "invalid" }],
    ["name is empty", { name: {} }],
    ["description is too short", { description: { en: "short" } }],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: knodeApiKeychain.ownerId,
        type: "ui-session",
      })
        .patch(`/knodeApiKeychains/${knodeApiKeychain.id}`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the Knode API keychain", async () => {
    const knodeApiKeychain: KnodeApiKeychain = {
      ...getMockKnodeApiKeychain(),
      ownerId: generateId<OrganizationId>(),
    };

    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/knodeApiKeychains/${knodeApiKeychain.id}`)
      .body({ name: { en: "Updated Knode API keychain name" } });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the Knode API keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/knodeApiKeychains/${generateId()}`)
      .body({ name: { en: "Updated Knode API keychain name" } });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .patch(`/knodeApiKeychains/${knodeApiKeychain.id}`)
        .body({ name: { en: "Updated Knode API keychain name" } });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid Knode API keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/knodeApiKeychains/not-a-uuid`)
      .body({ name: { en: "Updated Knode API keychain name" } });

    expect(response.statusCode).toBe(400);
  });
});
