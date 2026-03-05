/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { ConsumerKeychain } from "@knodia/keychain-models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { KeychainEventV1 } from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_Keychain } from "../src/models/api.ts";

import { consumerKeychainWriterService } from "./setup.ts";
import { getAllKeychainEvents, injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["technical"], type: "ui-session" },
];

describe("DELETE /consumerKeychain/:consumerKeychainId (deleteConsumerKeychain)", () => {
  const createBody = {
    description: { en: "Consumer keychain description" },
    name: { en: "Test Consumer keychain" },
  };

  it("should correctly create consumer keychain deletion event", async () => {
    const createResponse = await injectAppRequest(allowedTestTokens[0]!)
      .post("/consumerKeychains")
      .body(createBody);
    expect(createResponse.statusCode).toBe(201);

    const createdKeychain = createResponse.json<API_Keychain>();

    const keychainForReadmodel: ConsumerKeychain = {
      createdAt: new Date(createdKeychain.createdAt),
      description: createBody.description,
      id: unsafeBrandId(createdKeychain.id),
      keys: [],
      name: createBody.name,
      ownerId: unsafeBrandId(createdKeychain.ownerId),
      purposes: [],
      updatedAt: new Date(createdKeychain.updatedAt),
      users: [],
    };

    await consumerKeychainWriterService.upsertConsumerKeychain(
      keychainForReadmodel,
      0,
    );

    const deleteResponse = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychain/${createdKeychain.id}`,
    );

    expect(deleteResponse.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    expect(events).toHaveLength(2);

    const deletedEvent = events[1];
    expect(deletedEvent).toMatchObject({
      streamId: createdKeychain.id,
      type: "ConsumerKeychainDeletedV1",
      version: 1,
    });

    const deletedEventData = KeychainEventV1.parse(deletedEvent).data;
    expect(deletedEventData).toMatchObject({
      consumerKeychainId: createdKeychain.id,
    });
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      "/consumerKeychain/00000000-0000-0000-0000-000000000000",
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        "/consumerKeychain/00000000-0000-0000-0000-000000000000",
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
