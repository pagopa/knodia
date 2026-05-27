/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  generateId,
  type OrganizationId,
  type ProducerKeychainId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { calculateKid, createJWK, decodeBase64Pem } from "@knodia/crypto";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type KeychainKey,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_USER_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockKeychainKey,
  getMockProducerKeychain,
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
  seedProducerKeychain,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["technical"], type: "ui-session" },
];

const mockSeed: API_KeychainKeySeed = {
  encodedPem: createRsaPublicKeyBase64(),
  name: { en: "Valid key name" },
};

const producerKeychain: ProducerKeychain = {
  ...getMockProducerKeychain(),
  users: [
    {
      addedAt: new Date(),
      userId: TEST_USER_ID,
    },
  ],
};

async function uploadProducerKeychainKey({
  producerKeychainId = producerKeychain.id,
  requestBody = mockSeed,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: producerKeychain.ownerId,
    type: "ui-session",
  },
}: {
  producerKeychainId?: ProducerKeychainId;
  requestBody?: API_KeychainKeySeed;
  token?: TestToken;
} = {}) {
  return await injectAppRequest(token)
    .post(`/producerKeychains/${producerKeychainId}/keys`)
    .body(requestBody);
}

describe("POST /producerKeychains/:producerKeychainId/keys (uploadProducerKeychainKey)", () => {
  it("should correctly create producer keychain key added event", async () => {
    await seedProducerKeychain(producerKeychain);

    const expectedKid = unsafeBrandKeyId(
      calculateKid(
        createJWK({
          pemKey: decodeBase64Pem(mockSeed.encodedPem),
        }),
      ),
    );

    const response = await uploadProducerKeychainKey();

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
      streamId: producerKeychain.id,
      type: "ProducerKeychainKeyAddedV1",
      version: 1,
    });

    const expectedProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      keys: [...producerKeychain.keys, expectedKey],
    };

    expect(KeychainEventV1.parse(addedEvent)).toMatchObject({
      data: {
        kid: expectedKid,
        producerKeychain: {
          ...toProducerKeychainV1(expectedProducerKeychain),
          updatedAt: expect.any(Number),
        },
      },
      type: "ProducerKeychainKeyAddedV1",
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
      const response = await uploadProducerKeychainKey({
        requestBody: body as never,
      });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if the uploaded key is invalid", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await uploadProducerKeychainKey({
      requestBody: {
        encodedPem: Buffer.from("not a valid key", "utf-8").toString("base64"),
        name: { en: "Valid key name" },
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 with certificate-specific error if the uploaded key is an X.509 certificate", async () => {
    await seedProducerKeychain(producerKeychain);

    const response = await uploadProducerKeychainKey({
      requestBody: {
        encodedPem: createX509CertificateBase64(),
        name: { en: "Valid key name" },
      },
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
      await seedProducerKeychain(producerKeychain);

      const response = await uploadProducerKeychainKey({
        requestBody: {
          encodedPem,
          name: { en: "Valid key name" },
        },
      });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the producer keychain", async () => {
    const mockProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      ownerId: generateId<OrganizationId>(),
    };

    await seedProducerKeychain(mockProducerKeychain);

    const response = await uploadProducerKeychainKey({
      producerKeychainId: mockProducerKeychain.id,
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await uploadProducerKeychainKey({
      producerKeychainId: generateId<ProducerKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the caller is not a member of the producer keychain", async () => {
    const mockProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      users: [],
    };
    await seedProducerKeychain(mockProducerKeychain);

    const response = await uploadProducerKeychainKey({
      producerKeychainId: mockProducerKeychain.id,
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 409 if the key already exists in the producer keychain", async () => {
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

    const mockProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      keys: [existingKey],
    };

    await seedProducerKeychain(mockProducerKeychain);

    const response = await uploadProducerKeychainKey({
      producerKeychainId: mockProducerKeychain.id,
      requestBody: {
        encodedPem,
        name: { en: "Valid key name" },
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it("should return 400 if the keychain already reached the maximum number of keys", async () => {
    const mockProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      keys: Array.from({ length: mockMaxKeysPerKeychain }, (_, i) =>
        getMockKeychainKey(i),
      ),
    };

    await seedProducerKeychain(mockProducerKeychain);

    const response = await uploadProducerKeychainKey({
      producerKeychainId: mockProducerKeychain.id,
    });

    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await uploadProducerKeychainKey({ token });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await uploadProducerKeychainKey({
      producerKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });
});
