/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId, type ProducerKeychainId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockProducerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Keychain } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const producerKeychain = getMockProducerKeychain();
const VALID_PRODUCER_KEYCHAIN_ID = producerKeychain.id;
const NON_EXISTENT_PRODUCER_KEYCHAIN_ID = generateId<ProducerKeychainId>();

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getProducerKeychain = (
  producerKeychainId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/producerKeychains/${producerKeychainId}`);

describe("GET /producerKeychains/:producerKeychainId (getProducerKeychain)", () => {
  it.each(allowedTestTokens)(
    "should return the producer keychain with correct shape ($type, $roles)",
    async (token) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKeychain(
        VALID_PRODUCER_KEYCHAIN_ID,
        token,
      );

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
      expect(response.statusCode).toBe(200);

      const body = response.json<API_Keychain>();
      expect(body).toEqual(toAPI_Keychain(producerKeychain));
    },
  );

  it("should return the same producer keychain as the list endpoint", async () => {
    await seedProducerKeychain(producerKeychain);

    const uiToken: TestToken = {
      roles: ["administrative"],
      type: "ui-session",
    };
    const listResponse = await injectAppRequest(uiToken)
      .get("/producerKeychains")
      .query({ limit: "50", offset: "0" });
    const listBody = listResponse.json<{ results: API_Keychain[] }>();
    const expectedItem = listBody.results.find(
      (i) => i.id === VALID_PRODUCER_KEYCHAIN_ID,
    );

    const response = await getProducerKeychain(VALID_PRODUCER_KEYCHAIN_ID);
    const body = response.json<API_Keychain>();

    expect(body).toEqual(expectedItem!);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKeychain(
        VALID_PRODUCER_KEYCHAIN_ID,
        token,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent producer keychain id", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await getProducerKeychain(
      NON_EXISTENT_PRODUCER_KEYCHAIN_ID,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await getProducerKeychain("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
