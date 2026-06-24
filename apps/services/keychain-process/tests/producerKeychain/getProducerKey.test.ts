/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ProducerKeychain } from "@knodia/keychain-models";
import type { API_PublicKey } from "@knodia/keychain-models/api";

import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { toAPI_PublicKey } from "../../src/models/apiConverter.ts";
import { injectAppRequest, seedProducerKeychain } from "../utils.ts";

const existingKeys = [
  { ...getMockKeychainKey(0), createdAt: new Date(1) },
  { ...getMockKeychainKey(1), createdAt: new Date(2) },
];

const producerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  keys: existingKeys,
};

const requestedKey = existingKeys[0]!;
const VALID_KEY_ID = requestedKey.kid;
const NON_EXISTENT_KEY_ID = "non-existent-key-id";

const allowedTestTokens: TestToken[] = [{ type: "knode-api" }];

const getProducerKey = ({
  keyId = VALID_KEY_ID,
  token = allowedTestTokens[0]!,
}: {
  keyId?: string;
  token?: TestToken;
} = {}) => injectAppRequest(token).get(`/producerKeys/${keyId}`);

describe("GET /producerKeys/:keyId (getProducerKey)", () => {
  it.each(allowedTestTokens)(
    "should return the producer key with correct shape ($type, $roles)",
    async (token) => {
      await seedProducerKeychain(producerKeychain);

      const response = await getProducerKey({ token });

      expect(response.statusCode).toBe(200);

      const body = response.json<API_PublicKey>();
      expect(body).toEqual(toAPI_PublicKey(requestedKey));
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getProducerKey({ token });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent key id", async () => {
    const response = await getProducerKey({ keyId: NON_EXISTENT_KEY_ID });

    expect(response.statusCode).toBe(404);
  });
});
