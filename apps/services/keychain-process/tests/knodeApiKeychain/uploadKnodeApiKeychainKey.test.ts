/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
  type OrganizationId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { calculateKid, createJWK, decodeBase64Pem } from "@knodia/crypto";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type KeychainKey,
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_USER_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  API_KeychainKey,
  API_KeychainKeySeed,
} from "../../src/models/api.ts";

import { toAPI_KeychainKey } from "../../src/models/apiConverter.ts";
import { mockMaxKeysPerKeychain } from "../setup.ts";
import {
  createEcPublicKeyBase64,
  createMultiplePublicKeysBase64,
  createRsaPrivateKeyBase64,
  createRsaPublicKeyBase64,
  createShortRsaPublicKeyBase64,
  createX509CertificateBase64,
  getAllKeychainEvents,
  injectAppRequest,
  seedKnodeApiKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["technical"], type: "ui-session" },
];

const mockSeed: API_KeychainKeySeed = {
  encodedPem: createRsaPublicKeyBase64(),
  name: { en: "Valid key name" },
};

const knodeApiKeychain: KnodeApiKeychain = {
  ...getMockKnodeApiKeychain(),
  users: [
    {
      addedAt: new Date(),
      userId: TEST_USER_ID,
    },
  ],
};

describe("POST /knodeApiKeychains/:knodeApiKeychainId/keys (uploadKnodeApiKeychainKey)", () => {
  it("should correctly create knode API keychain key added event", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const expectedKid = unsafeBrandKeyId(
      calculateKid(
        createJWK({
          pemKey: decodeBase64Pem(mockSeed.encodedPem),
        }),
      ),
    );

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_KeychainKey>();
    const expectedKey: KeychainKey = {
      algorithm: "RS256",
      createdAt: new Date(responseBody.createdAt),
      encodedPem: mockSeed.encodedPem,
      format: "PublicKey",
      kid: expectedKid,
      name: mockSeed.name,
      userId: TEST_USER_ID,
    };

    expect(responseBody).toEqual(toAPI_KeychainKey(expectedKey));

    const events = await getAllKeychainEvents();
    const addedEvent = events[1];

    expect(addedEvent).toMatchObject({
      streamId: knodeApiKeychain.id,
      type: "KnodeApiKeychainKeyAddedV1",
      version: 1,
    });

    const parsedAddedEvent = KeychainEventV1.parse(addedEvent);
    if (parsedAddedEvent.type !== "KnodeApiKeychainKeyAddedV1") {
      throw new Error(`Unexpected event type: ${parsedAddedEvent.type}`);
    }
    const addedEventData = parsedAddedEvent.data;
    const expectedKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      keys: [...knodeApiKeychain.keys, expectedKey],
      updatedAt: new Date(addedEventData.knodeApiKeychain!.updatedAt),
    };

    expect(addedEventData).toMatchObject({
      kid: expectedKid,
      knodeApiKeychain: toKnodeApiKeychainV1(expectedKnodeApiKeychain),
    });
  });

  it.each([
    ["invalid property", { invalidProperty: "invalid" }],
    ["empty body", {}],
    [
      "name too short",
      { encodedPem: mockSeed.encodedPem, name: { en: "abc" } },
    ],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: knodeApiKeychain.ownerId,
        type: "ui-session",
      })
        .post(`/knodeApiKeychains/${knodeApiKeychain.id}/keys`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if the uploaded key is invalid", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/keys`)
      .body({
        encodedPem: Buffer.from("not a valid key", "utf-8").toString("base64"),
        name: { en: "Valid key name" },
      });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 with certificate-specific error if the uploaded key is an X.509 certificate", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: knodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${knodeApiKeychain.id}/keys`)
      .body({
        encodedPem: createX509CertificateBase64(),
        name: { en: "Valid key name" },
      });

    expect(response.statusCode).toBe(400);
  });

  it.each([
    ["private key", createRsaPrivateKeyBase64()],
    ["EC public key", createEcPublicKeyBase64()],
    ["RSA key shorter than 2048 bits", createShortRsaPublicKeyBase64()],
    ["multiple public keys", createMultiplePublicKeysBase64()],
  ])(
    "should return 400 if the uploaded key is not allowed - %s",
    async (_label, encodedPem) => {
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: knodeApiKeychain.ownerId,
        type: "ui-session",
      })
        .post(`/knodeApiKeychains/${knodeApiKeychain.id}/keys`)
        .body({
          encodedPem,
          name: { en: "Valid key name" },
        });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the Knode Api keychain", async () => {
    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the Knode Api keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/knodeApiKeychains/${generateId()}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the caller is not a member of the Knode Api keychain", async () => {
    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      users: [],
    };
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(403);
  });

  it("should return 409 if the key already exists in the Knode Api keychain", async () => {
    const encodedPem = createRsaPublicKeyBase64();
    const kid = unsafeBrandKeyId(
      calculateKid(
        createJWK({
          pemKey: decodeBase64Pem(encodedPem),
        }),
      ),
    );

    const existingKey: KeychainKey = {
      algorithm: "RS256",
      createdAt: new Date(),
      encodedPem,
      format: "PublicKey",
      kid,
      name: { en: "Existing key name" },
      userId: TEST_USER_ID,
    };

    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      keys: [existingKey],
    };

    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys`)
      .body({
        encodedPem,
        name: { en: "Valid key name" },
      });

    expect(response.statusCode).toBe(409);
  });

  it("should return 400 if the keychain already reached the maximum number of keys", async () => {
    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      keys: Array.from({ length: mockMaxKeysPerKeychain }, (_, i) =>
        getMockKeychainKey(i),
      ),
    };

    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockKnodeApiKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/knodeApiKeychains/${mockKnodeApiKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .post(`/knodeApiKeychains/${generateId()}/keys`)
        .body(mockSeed);

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid Knode API keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/knodeApiKeychains/not-a-uuid/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(400);
  });
});
