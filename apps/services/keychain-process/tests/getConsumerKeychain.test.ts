/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ConsumerKeychainId, generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_Keychain } from "../src/models/api.ts";

import { toAPI_Keychain } from "../src/models/apiConverter.ts";
import { mockConsumerKeychains } from "./mockConsumerKeychains.ts";
import { injectAppRequest, seedConsumerKeychain } from "./utils.ts";

const consumerKeychain = mockConsumerKeychains[0]!;
const VALID_CONSUMER_KEYCHAIN_ID = consumerKeychain.id;
const NON_EXISTENT_CONSUMER_KEYCHAIN_ID = generateId<ConsumerKeychainId>();

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getConsumerKeychain = (
  consumerKeychainId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/consumerKeychains/${consumerKeychainId}`);

describe("GET /consumerKeychains/:consumerKeychainId (getConsumerKeychain)", () => {
  it.each(allowedTestTokens)(
    "should return the consumer keychain with correct shape ($type, $roles)",
    async (token) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await getConsumerKeychain(
        VALID_CONSUMER_KEYCHAIN_ID,
        token,
      );

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
      expect(response.statusCode).toBe(200);

      const body = response.json<API_Keychain>();
      expect(body).toEqual(toAPI_Keychain(consumerKeychain));
    },
  );

  it("should return the same consumer keychain as the list endpoint", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const uiToken: TestToken = {
      roles: ["administrative"],
      type: "ui-session",
    };
    const listResponse = await injectAppRequest(uiToken)
      .get("/consumerKeychains")
      .query({ limit: "50", offset: "0" });
    const listBody = listResponse.json<{ items: API_Keychain[] }>();
    const expectedItem = listBody.items.find(
      (i) => i.id === VALID_CONSUMER_KEYCHAIN_ID,
    );

    const response = await getConsumerKeychain(VALID_CONSUMER_KEYCHAIN_ID);
    const body = response.json<API_Keychain>();

    expect(body).toEqual(expectedItem!);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getConsumerKeychain(
        VALID_CONSUMER_KEYCHAIN_ID,
        token,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent consumer keychain id", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await getConsumerKeychain(
      NON_EXISTENT_CONSUMER_KEYCHAIN_ID,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid consumer keychain id format", async () => {
    const response = await getConsumerKeychain("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
