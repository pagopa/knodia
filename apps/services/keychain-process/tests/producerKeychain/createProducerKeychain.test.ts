/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { unsafeBrandId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  type API_Keychain,
  type API_KeychainSeed,
} from "../../src/models/api.ts";
import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import { getAllKeychainEvents, injectAppRequest } from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /producerKeychains (createProducerKeychain)", () => {
  const body: API_KeychainSeed = {
    description: { en: "Producer keychain description" },
    name: { en: "Test Producer keychain" },
  };

  function createProducerKeychain({
    requestBody = body,
    token = allowedTestTokens[0]!,
  }: {
    requestBody?: API_KeychainSeed;
    token?: TestToken;
  } = {}) {
    return injectAppRequest(token).post("/producerKeychains").body(requestBody);
  }

  it("should correctly create producer keychain creation event", async () => {
    const response = await createProducerKeychain();

    expect(response.statusCode).toBe(201);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");

    const responseBody = response.json<API_Keychain>();

    const expectedProducerKeychain: ProducerKeychain = {
      createdAt: new Date(responseBody.createdAt),
      description: body.description,
      id: unsafeBrandId(responseBody.id),
      keys: [],
      name: body.name,
      ownerId: TEST_ORGANIZATION_ID,
      updatedAt: new Date(responseBody.updatedAt),
      users: [],
    };

    expect(responseBody).toMatchObject(
      toAPI_Keychain(expectedProducerKeychain),
    );

    const events = await getAllKeychainEvents();
    expect(events).toHaveLength(1);

    const createdEvent = events[0];

    expect(createdEvent).toMatchObject({
      streamId: responseBody.id,
      type: "ProducerKeychainCreatedV1",
      version: 0,
    });

    expect(KeychainEventV1.parse(createdEvent)).toMatchObject({
      data: {
        producerKeychain: toProducerKeychainV1(expectedProducerKeychain),
      },
      type: "ProducerKeychainCreatedV1",
    });
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["name is a number", { ...body, name: 99 }],
    ["name is empty", { ...body, name: {} }],
    [
      "name is valid but has invalid property",
      {
        ...body,
        name: { en: "Test Producer keychain" },
        wrongProperty: "wrong",
      },
    ],
    ["description is too short", { ...body, description: { en: "short" } }],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, requestBody) => {
      const response = await createProducerKeychain({ requestBody } as never);
      expect(response.statusCode).toBe(400);
    },
  );
  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await createProducerKeychain({ token: spec });
      expect(response.statusCode).toBe(403);
    },
  );
});
