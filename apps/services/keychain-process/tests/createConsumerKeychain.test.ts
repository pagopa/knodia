import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type { ConsumerKeychain } from "@knodia/keychain-models";

import { KeychainEventV1, toConsumerKeychainV1 } from "@knodia/keychain-models";
import { describe, expect, it } from "vitest";

import { API_ConsumerKeychainSeed, API_Keychain } from "../src/models/api.ts";
import { toAPI_Keychain } from "../src/models/apiConverter.ts";
import { getAllKeychainEvents, injectAppRequest } from "./utils.ts";

describe("POST /consumer-keychains (createConsumerKeychain)", () => {
  const body: API_ConsumerKeychainSeed = {
    description: { en: "Consumer keychain description" },
    name: { en: "Test Consumer keychain" },
  };

  it("should correctly create consumer keychain creation event", async () => {
    const response = await injectAppRequest()
      .post("/consumer-keychains")
      .body(body);
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Keychain>();

    const expectedConsumerKeychain: ConsumerKeychain = {
      createdAt: new Date(responseBody.createdAt),
      description: body.description,
      id: responseBody.id as ConsumerKeychainId,
      keys: [],
      name: body.name,
      ownerId: expect.any(String),
      purposes: [],
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

    const createdEventData = KeychainEventV1.parse(createdEvent).data;
    expect(createdEventData.consumerKeychain).toMatchObject(
      toConsumerKeychainV1(expectedConsumerKeychain),
    );
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
      const response = await injectAppRequest()
        .post("/consumer-keychains")
        .body(requestBody as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
