/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  generateId,
  type OrganizationId,
  type ProducerKeychainId,
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

import type { API_Keychain, API_KeychainPatch } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedProducerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const producerKeychain = getMockProducerKeychain();

const defaultBody: API_KeychainPatch = {
  name: { en: "Updated Producer keychain name" },
};

async function updateProducerKeychain({
  producerKeychainId = producerKeychain.id,
  requestBody = defaultBody,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: producerKeychain.ownerId,
    type: "ui-session",
  },
}: {
  producerKeychainId?: ProducerKeychainId;
  requestBody?: API_KeychainPatch;
  token?: TestToken;
}) {
  return await injectAppRequest(token)
    .patch(`/producerKeychains/${producerKeychainId}`)
    .body(requestBody);
}

describe("PATCH /producerKeychains/:producerKeychainId (ProducerKeychainPatch)", () => {
  it.each([
    {
      body: {
        description: { en: "Updated Producer keychain description" },
        name: { en: "Updated Producer keychain name" },
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
        name: { en: "Updated Producer keychain name" },
      },
    },
    {
      body: {
        description: { en: "Updated Producer keychain description" },
      },
    },
  ] satisfies { body: API_KeychainPatch }[])(
    "should correctly create producer keychain update event with body %S",
    async ({ body }) => {
      await seedProducerKeychain(producerKeychain);

      const response = await updateProducerKeychain({ requestBody: body });

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
      expect(response.statusCode).toBe(200);

      const responseBody = response.json<API_Keychain>();
      const expectedProducerKeychain: ProducerKeychain = {
        ...producerKeychain,
        description:
          body.description === null
            ? undefined
            : (body.description ?? producerKeychain.description),
        name: body.name ?? producerKeychain.name,
        updatedAt: new Date(responseBody.updatedAt),
      };

      expect(responseBody).toEqual(toAPI_Keychain(expectedProducerKeychain));

      const events = await getAllKeychainEvents();

      const updatedEvent = events.filter(
        (e) => e.streamId === producerKeychain.id,
      )[1];

      expect(updatedEvent).toMatchObject({
        streamId: producerKeychain.id,
        type: "ProducerKeychainUpdatedV1",
        version: 1,
      });

      const updatedEventData = KeychainEventV1.parse(updatedEvent).data;
      expect(updatedEventData).toMatchObject({
        producerKeychain: toProducerKeychainV1(expectedProducerKeychain),
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
      await seedProducerKeychain(producerKeychain);

      const response = await updateProducerKeychain({
        requestBody: body as never,
      });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    const producerKeychain: ProducerKeychain = {
      ...getMockProducerKeychain(),
      ownerId: generateId<OrganizationId>(),
    };

    await seedProducerKeychain(producerKeychain);

    const response = await updateProducerKeychain({
      token: {
        ...allowedTestTokens[0]!,
        organizationId: generateId<OrganizationId>(),
        type: "ui-session",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await updateProducerKeychain({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await updateProducerKeychain({ token: spec });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await updateProducerKeychain({
      producerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });
});
