/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId, type KnodeApiKeychainId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_Keychain } from "../../src/models/api.ts";

import { toAPI_Keychain } from "../../src/models/apiConverter.ts";
import { mockKnodeApiKeychains } from "../mockKnodeApiKeychains.ts";
import { injectAppRequest, seedKnodeApiKeychain } from "../utils.ts";

const knodeApiKeychain = mockKnodeApiKeychains[0]!;
const VALID_KNODE_API_KEYCHAIN_ID = knodeApiKeychain.id;
const NON_EXISTENT_KNODE_API_KEYCHAIN_ID = generateId<KnodeApiKeychainId>();

const allowedTestTokens: TestToken[] = [
  { type: "internal" },
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const getKnodeApiKeychain = (
  knodeApiKeychainId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/knodeApiKeychains/${knodeApiKeychainId}`);

describe("GET /knodeApiKeychains/:knodeApiKeychainId (getKnodeApiKeychain)", () => {
  it.each(allowedTestTokens)(
    "should return the knode API keychain with correct shape ($type, $roles)",
    async (token) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await getKnodeApiKeychain(
        VALID_KNODE_API_KEYCHAIN_ID,
        token,
      );

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
      expect(response.statusCode).toBe(200);

      const body = response.json<API_Keychain>();
      expect(body).toEqual(toAPI_Keychain(knodeApiKeychain));
    },
  );

  // TODO: re-enable this test once the list endpoint is implemented
  // eslint-disable-next-line vitest/no-commented-out-tests
  // it("should return the same knode API keychain as the list endpoint", async () => {
  // });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await getKnodeApiKeychain(
        VALID_KNODE_API_KEYCHAIN_ID,
        token,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 for non-existent knode API keychain id", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await getKnodeApiKeychain(
      NON_EXISTENT_KNODE_API_KEYCHAIN_ID,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 400 for invalid knode API keychain id format", async () => {
    const response = await getKnodeApiKeychain("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });
});
