import {
  generateId,
  generateUserId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import type { ConsumerKeychain, KnodeApiKeychain } from "../src/keychain.ts";

import {
  fromConsumerKeychainV1,
  fromKnodeApiKeychainV1,
} from "../src/keychainProtobufConverterFromV1.ts";
import {
  toConsumerKeychainV1,
  toKnodeApiKeychainV1,
} from "../src/keychainProtobufConverterToV1.ts";

const consumerKeychain: ConsumerKeychain = {
  createdAt: new Date(1_700_000_000_000),
  description: { en: "Consumer keychain description" },
  id: generateId(),
  keys: [
    {
      algorithm: "RS256",
      createdAt: new Date(1_700_000_001_000),
      encodedPem: "-----BEGIN CERTIFICATE-----xyz",
      format: "PublicKey",
      kid: unsafeBrandKeyId(
        Buffer.from(crypto.randomUUID()).toString("base64"),
      ),
      name: { en: "Primary key" },
      userId: generateUserId(),
    },
  ],
  name: { en: "Test Consumer keychain" },
  ownerId: generateId(),
  updatedAt: new Date(1_700_000_002_000),
  users: [{ addedAt: new Date(1_700_000_003_000), userId: generateUserId() }],
};

const knodeApiKeychain: KnodeApiKeychain = {
  createdAt: new Date(1_700_000_010_000),
  description: { en: "Knode API keychain description" },
  id: generateId(),
  keys: [
    {
      algorithm: "RS256",
      createdAt: new Date(1_700_000_011_000),
      encodedPem: "-----BEGIN CERTIFICATE-----abc",
      format: "X509Certificate",
      kid: unsafeBrandKeyId(
        Buffer.from(crypto.randomUUID()).toString("base64"),
      ),
      name: { en: "API key" },
      userId: generateUserId(),
    },
  ],
  name: { en: "Test Knode API keychain" },
  ownerId: generateId(),
  updatedAt: new Date(1_700_000_012_000),
  users: [{ addedAt: new Date(1_700_000_013_000), userId: generateUserId() }],
};

describe("keychain protobuf converters", () => {
  it("ConsumerKeychain roundtrips through V1", () => {
    expect(
      fromConsumerKeychainV1(toConsumerKeychainV1(consumerKeychain)),
    ).toEqual(consumerKeychain);
  });

  it("KnodeApiKeychain roundtrips through V1", () => {
    expect(
      fromKnodeApiKeychainV1(toKnodeApiKeychainV1(knodeApiKeychain)),
    ).toEqual(knodeApiKeychain);
  });

  it("toKnodeApiKeychainV1 encodes dates as epoch millis", () => {
    const v1 = toKnodeApiKeychainV1(knodeApiKeychain);
    expect(v1.createdAt).toBe(knodeApiKeychain.createdAt.getTime());
    expect(v1.updatedAt).toBe(knodeApiKeychain.updatedAt.getTime());
    expect(v1.keys[0]?.createdAt).toBe(
      knodeApiKeychain.keys[0]?.createdAt.getTime(),
    );
    expect(v1.users[0]?.addedAt).toBe(
      knodeApiKeychain.users[0]?.addedAt.getTime(),
    );
  });
});
