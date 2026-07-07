/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { unsafeBrandId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  type API_Keychain,
  type API_KeychainSeed,
} from "../../src/models/api.ts";
import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import {
  consumerKeychainWriterService,
  producerKeychainWriterService,
} from "../setup.ts";
import { getAllKeychainEvents, injectAppRequest } from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /consumerKeychains (createConsumerKeychain)", () => {
  const body: API_KeychainSeed = {
    description: { en: "Consumer keychain description" },
    name: { en: "Test Consumer keychain" },
  };

  it("should correctly create consumer keychain creation event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/consumerKeychains")
      .body(body);

    expect(response.statusCode).toBe(201);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");

    const responseBody = response.json<API_Keychain>();

    const expectedConsumerKeychain: ConsumerKeychain = {
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
      toAPI_Keychain(expectedConsumerKeychain),
    );

    const events = await getAllKeychainEvents();
    expect(events).toHaveLength(1);

    const createdEvent = events[0];

    expect(createdEvent).toMatchObject({
      streamId: responseBody.id,
      type: "ConsumerKeychainCreatedV1",
      version: 0,
    });

    expect(KeychainEventV1.parse(createdEvent)).toMatchObject({
      data: {
        consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
      },
      type: "ConsumerKeychainCreatedV1",
    });
  });

  it("should return 409 if a consumer keychain with the same name already exists for the same owner", async () => {
    await consumerKeychainWriterService.upsertConsumerKeychain(
      {
        ...getMockConsumerKeychain(),
        name: body.name,
        ownerId: TEST_ORGANIZATION_ID,
      },
      0,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/consumerKeychains")
      .body(body);
    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if the existing consumer keychain name differs only by case", async () => {
    await consumerKeychainWriterService.upsertConsumerKeychain(
      {
        ...getMockConsumerKeychain(),
        name: { en: body.name.en.toUpperCase() },
        ownerId: TEST_ORGANIZATION_ID,
      },
      0,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/consumerKeychains")
      .body(body);
    expect(response.statusCode).toBe(409);
  });

  it("should succeed if a consumer keychain with the same name exists for a different owner", async () => {
    await consumerKeychainWriterService.upsertConsumerKeychain(
      { ...getMockConsumerKeychain(), name: body.name },
      0,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/consumerKeychains")
      .body(body);
    expect(response.statusCode).toBe(201);
  });

  it("should succeed if a producer keychain with the same name exists for the same owner", async () => {
    await producerKeychainWriterService.upsertProducerKeychain(
      {
        ...getMockProducerKeychain(),
        name: body.name,
        ownerId: TEST_ORGANIZATION_ID,
      },
      0,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/consumerKeychains")
      .body(body);
    expect(response.statusCode).toBe(201);
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["name is a number", { ...body, name: 99 }],
    ["name is empty", { ...body, name: {} }],
    [
      "name is valid but has invalid property",
      {
        ...body,
        name: { en: "Test Consumer keychain" },
        wrongProperty: "wrong",
      },
    ],
    ["description is too short", { ...body, description: { en: "short" } }],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, requestBody) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/consumerKeychains")
        .body(requestBody as never);
      expect(response.statusCode).toBe(400);
    },
  );
  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/consumerKeychains")
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );
});
