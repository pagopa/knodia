/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
  type OrganizationId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import {
  calculateKid,
  createJWK,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  type ConsumerKeychainKey,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_USER_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockConsumerKeychainKey,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  API_KeychainKey,
  API_KeychainKeySeed,
} from "../src/models/api.ts";

import { toAPI_KeychainKey } from "../src/models/apiConverter.ts";
import { mockMaxKeysPerKeychain } from "./setup.ts";
import {
  createEcKeyPair,
  createRsaKeyPair,
  getAllKeychainEvents,
  injectAppRequest,
  rsaX509CertificatePem,
  seedConsumerKeychain,
  toBase64,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["technical"], type: "ui-session" },
];

const createRsaPublicKeyBase64 = () =>
  toBase64(createRsaKeyPair(2048).publicKey);

const createRsaPrivateKeyBase64 = () =>
  toBase64(createRsaKeyPair(2048).privateKey);

const createEcPublicKeyBase64 = () => toBase64(createEcKeyPair().publicKey);

const createShortRsaPublicKeyBase64 = () =>
  toBase64(createRsaKeyPair(1024).publicKey);

const createMultiplePublicKeysBase64 = () =>
  toBase64(
    [
      decodeBase64Pem(createRsaPublicKeyBase64()).trim(),
      decodeBase64Pem(createRsaPublicKeyBase64()).trim(),
    ].join("\n"),
  );

const createX509CertificateBase64 = () => toBase64(rsaX509CertificatePem);

const mockSeed: API_KeychainKeySeed = {
  encodedPem: createRsaPublicKeyBase64(),
  name: { en: "Valid key name" },
};

const consumerKeychain: ConsumerKeychain = {
  ...getMockConsumerKeychain(),
  users: [
    {
      addedAt: new Date(),
      userId: TEST_USER_ID,
    },
  ],
};

describe("POST /consumerKeychains/:consumerKeychainId/keys (uploadConsumerKeychainKey)", () => {
  it("should correctly create consumer keychain key added event", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const expectedKid = unsafeBrandKeyId(
      calculateKid(
        createJWK({
          pemKey: decodeBase64Pem(mockSeed.encodedPem),
        }),
      ),
    );

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_KeychainKey>();
    const expectedKey: ConsumerKeychainKey = {
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
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainKeyAddedV1",
      version: 1,
    });

    const addedEventData = KeychainEventV1.parse(addedEvent).data;
    const expectedConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      keys: [...consumerKeychain.keys, expectedKey],
      updatedAt: new Date(addedEventData.consumerKeychain!.updatedAt),
    };

    expect(addedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
      kid: expectedKid,
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
        organizationId: consumerKeychain.ownerId,
        type: "ui-session",
      })
        .post(`/consumerKeychains/${consumerKeychain.id}/keys`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if the uploaded key is invalid", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/keys`)
      .body({
        encodedPem: Buffer.from("not a valid key", "utf-8").toString("base64"),
        name: { en: "Valid key name" },
      });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 with certificate-specific error if the uploaded key is an X.509 certificate", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/keys`)
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
      await seedConsumerKeychain(consumerKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: consumerKeychain.ownerId,
        type: "ui-session",
      })
        .post(`/consumerKeychains/${consumerKeychain.id}/keys`)
        .body({
          encodedPem,
          name: { en: "Valid key name" },
        });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const mockConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${mockConsumerKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${generateId()}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the caller is not a member of the consumer keychain", async () => {
    const mockConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      users: [],
    };
    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${mockConsumerKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(403);
  });

  it("should return 409 if the key already exists in the consumer keychain", async () => {
    const encodedPem = createRsaPublicKeyBase64();
    const kid = unsafeBrandKeyId(
      calculateKid(
        createJWK({
          pemKey: decodeBase64Pem(encodedPem),
        }),
      ),
    );

    const existingKey: ConsumerKeychainKey = {
      algorithm: "RS256",
      createdAt: new Date(),
      encodedPem,
      format: "PublicKey",
      kid,
      name: { en: "Existing key name" },
      userId: TEST_USER_ID,
    };

    const mockConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      keys: [existingKey],
    };

    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${mockConsumerKeychain.id}/keys`)
      .body({
        encodedPem,
        name: { en: "Valid key name" },
      });

    expect(response.statusCode).toBe(409);
  });

  it("should return 400 if the keychain already reached the maximum number of keys", async () => {
    const mockConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      keys: Array.from({ length: mockMaxKeysPerKeychain }, (_, i) =>
        getMockConsumerKeychainKey(i),
      ),
    };

    await seedConsumerKeychain(mockConsumerKeychain);

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: mockConsumerKeychain.ownerId,
      type: "ui-session",
    })
      .post(`/consumerKeychains/${mockConsumerKeychain.id}/keys`)
      .body(mockSeed);

    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .post(`/consumerKeychains/${generateId()}/keys`)
        .body(mockSeed);

      expect(response.statusCode).toBe(403);
    },
  );
});
