/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Keychain, API_KeychainPatch } from "../../src/models/api.ts";

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

describe("PATCH /consumerKeychains/:consumerKeychainId (ConsumerKeychainPatch)", () => {
  it.each([
    {
      body: {
        description: { en: "Updated Consumer keychain description" },
        name: { en: "Updated Consumer keychain name" },
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
        name: { en: "Updated Consumer keychain name" },
      },
    },
    {
      body: {
        description: { en: "Updated Consumer keychain description" },
      },
    },
  ] satisfies { body: API_KeychainPatch }[])(
    "should correctly create consumer keychain update event with body %S",
    async ({ body }) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: consumerKeychain.ownerId,
        type: "ui-session",
      })
        .patch(`/consumerKeychains/${consumerKeychain.id}`)
        .body(body);

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
      expect(response.statusCode).toBe(200);

      const responseBody = response.json<API_Keychain>();
      const expectedConsumerKeychain: ConsumerKeychain = {
        ...consumerKeychain,
        description:
          body.description === null
            ? undefined
            : (body.description ?? consumerKeychain.description),
        name: body.name ?? consumerKeychain.name,
        updatedAt: new Date(responseBody.updatedAt),
      };

      expect(responseBody).toEqual(toAPI_Keychain(expectedConsumerKeychain));

      const events = await getAllKeychainEvents();

      const updatedEvent = events.filter(
        (e) => e.streamId === consumerKeychain.id,
      )[1];

      expect(updatedEvent).toMatchObject({
        streamId: consumerKeychain.id,
        type: "ConsumerKeychainUpdatedV1",
        version: 1,
      });

      const updatedEventData = KeychainEventV1.parse(updatedEvent).data;
      expect(updatedEventData).toMatchObject({
        consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
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
      await seedConsumerKeychain(consumerKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: consumerKeychain.ownerId,
        type: "ui-session",
      })
        .patch(`/consumerKeychains/${consumerKeychain.id}`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...getMockConsumerKeychain(),
      ownerId: generateId<OrganizationId>(),
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/consumerKeychains/${consumerKeychain.id}`)
      .body({ name: { en: "Updated Consumer keychain name" } });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/consumerKeychains/${generateId()}`)
      .body({ name: { en: "Updated Consumer keychain name" } });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .patch(`/consumerKeychains/${consumerKeychain.id}`)
        .body({ name: { en: "Updated Consumer keychain name" } });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/consumerKeychains/not-a-uuid`)
      .body({ name: { en: "Updated Consumer keychain name" } });

    expect(response.statusCode).toBe(400);
  });
});
