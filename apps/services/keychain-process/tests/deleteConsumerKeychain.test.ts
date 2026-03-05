/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId } from "@knodia/common-models/ids";
import { KeychainEventV1, toConsumerKeychainV1 } from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { consumerKeychainWriterService } from "./setup.ts";
import { getAllKeychainEvents, injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["technical"], type: "ui-session" },
];

const consumerKeychain = getMockConsumerKeychain();

describe("DELETE /consumerKeychain/:consumerKeychainId (deleteConsumerKeychain)", () => {
  it("should correctly create consumer keychain deletion event", async () => {
    await consumerKeychainWriterService.upsertConsumerKeychain(
      consumerKeychain,
      0,
    );

    const deleteResponse = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychain/${consumerKeychain.id}`,
    );

    expect(deleteResponse.statusCode).toBe(204);

    const events = await getAllKeychainEvents();
    expect(events).toHaveLength(2);

    const deletedEvent = events[1];
    expect(deletedEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainDeletedV1",
      version: 1,
    });

    const deletedEventData = KeychainEventV1.parse(deletedEvent).data;
    expect(deletedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
    });
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/consumerKeychain/${generateId()}`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        `/consumerKeychain/${consumerKeychain.id}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );
});
