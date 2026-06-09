/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { API_KeychainKey } from "@knodia/keychain-models/api";

import {
  generateId,
  type KnodeApiKeychainId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { calculateKid, createJWK, decodeBase64Pem } from "@knodia/crypto";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  KeychainEventV1,
  type KeychainKey,
  type KnodeApiKeychain,
  type ProducerKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_USER_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockKeychainKey,
  getMockKnodeApiKeychain,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_KeychainKeySeed } from "../../src/models/api.ts";

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
  seedConsumerKeychain,
  seedKnodeApiKeychain,
  seedProducerKeychain,
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

async function uploadKnodeApiKeychainKey({
  knodeApiKeychainId = knodeApiKeychain.id,
  requestBody = mockSeed,
  token = {
    ...allowedTestTokens[0]!,
    organizationId: knodeApiKeychain.ownerId,
    type: "ui-session",
  },
}: {
  knodeApiKeychainId?: KnodeApiKeychainId;
  requestBody?: API_KeychainKeySeed;
  token?: TestToken;
} = {}) {
  return await injectAppRequest(token)
    .post(`/knodeApiKeychains/${knodeApiKeychainId}/keys`)
    .body(requestBody);
}

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

    const response = await uploadKnodeApiKeychainKey();

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
      const response = await uploadKnodeApiKeychainKey({
        requestBody: body as never,
      });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if the uploaded key is invalid", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await uploadKnodeApiKeychainKey({
      requestBody: {
        encodedPem: Buffer.from("not a valid key", "utf-8").toString("base64"),
        name: { en: "Valid key name" },
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 with certificate-specific error if the uploaded key is an X.509 certificate", async () => {
    await seedKnodeApiKeychain(knodeApiKeychain);

    const response = await uploadKnodeApiKeychainKey({
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
      await seedKnodeApiKeychain(knodeApiKeychain);

      const response = await uploadKnodeApiKeychainKey({
        requestBody: {
          encodedPem,
          name: { en: "Valid key name" },
        },
      });

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the Knode Api keychain", async () => {
    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      ownerId: generateId(),
    };

    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await uploadKnodeApiKeychainKey({
      knodeApiKeychainId: mockKnodeApiKeychain.id,
    });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the Knode Api keychain does not exist", async () => {
    const response = await uploadKnodeApiKeychainKey({
      knodeApiKeychainId: generateId<KnodeApiKeychainId>(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the caller is not a member of the Knode Api keychain", async () => {
    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      users: [],
    };
    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await uploadKnodeApiKeychainKey({
      knodeApiKeychainId: mockKnodeApiKeychain.id,
    });

    expect(response.statusCode).toBe(403);
  });

  it.each([
    [
      "Consumer Keychain",
      async (existingKey: KeychainKey) => {
        const mockConsumerKeychain: ConsumerKeychain = {
          ...getMockConsumerKeychain(),
          id: generateId(),
          keys: [existingKey],
        };

        await seedConsumerKeychain(mockConsumerKeychain);
      },
    ],
    [
      "Knode API Keychain",
      async (existingKey: KeychainKey) => {
        const mockKnodeApiKeychain: KnodeApiKeychain = {
          ...getMockKnodeApiKeychain(),
          id: generateId(),
          keys: [existingKey],
        };

        await seedKnodeApiKeychain(mockKnodeApiKeychain);
      },
    ],
    [
      "Producer Keychain",
      async (existingKey: KeychainKey) => {
        const mockProducerKeychain: ProducerKeychain = {
          ...getMockProducerKeychain(),
          id: generateId(),
          keys: [existingKey],
        };

        await seedProducerKeychain(mockProducerKeychain);
      },
    ],
  ])(
    "should return 409 with keyAlreadyExists if key already exists in %s",
    async (_keychainKind, seedExistingKeychain) => {
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

      await seedExistingKeychain(existingKey);

      const targetKnodeApiKeychain: KnodeApiKeychain = {
        ...knodeApiKeychain,
        keys: [],
      };
      await seedKnodeApiKeychain(targetKnodeApiKeychain);

      const response = await uploadKnodeApiKeychainKey({
        knodeApiKeychainId: targetKnodeApiKeychain.id,
        requestBody: {
          encodedPem,
          name: { en: "Valid key name" },
        },
      });

      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 400 if the keychain already reached the maximum number of keys", async () => {
    const mockKnodeApiKeychain: KnodeApiKeychain = {
      ...knodeApiKeychain,
      keys: Array.from({ length: mockMaxKeysPerKeychain }, (_, i) =>
        getMockKeychainKey(i),
      ),
    };

    await seedKnodeApiKeychain(mockKnodeApiKeychain);

    const response = await uploadKnodeApiKeychainKey({
      knodeApiKeychainId: mockKnodeApiKeychain.id,
    });

    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await uploadKnodeApiKeychainKey({
        token,
      });

      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 400 for invalid Knode API keychain id format", async () => {
    const response = await uploadKnodeApiKeychainKey({
      knodeApiKeychainId: "not-a-uuid" as never,
    });

    expect(response.statusCode).toBe(400);
  });
});
