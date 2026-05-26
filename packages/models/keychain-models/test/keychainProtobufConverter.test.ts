import {
  type ConsumerKeychainId,
  generateId,
  generateUserId,
  type KnodeApiKeychainId,
  type ProducerKeychainId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import { match } from "ts-pattern";
import { describe, expect, it } from "vitest";

import type {
  ConsumerKeychain,
  KnodeApiKeychain,
  ProducerKeychain,
} from "../src/keychain.ts";

import {
  fromConsumerKeychainV1,
  fromKnodeApiKeychainV1,
  fromProducerKeychainV1,
} from "../src/keychainProtobufConverterFromV1.ts";
import {
  toConsumerKeychainV1,
  toKnodeApiKeychainV1,
  toProducerKeychainV1,
} from "../src/keychainProtobufConverterToV1.ts";

function createMockKeychain(type: "Consumer"): ConsumerKeychain;
function createMockKeychain(type: "Knode API"): KnodeApiKeychain;
function createMockKeychain(type: "Producer"): ProducerKeychain;
function createMockKeychain(
  type: "Consumer" | "Knode API" | "Producer",
): ConsumerKeychain | KnodeApiKeychain | ProducerKeychain {
  const commonKeychainProperties: Omit<
    ConsumerKeychain & KnodeApiKeychain & ProducerKeychain,
    "id"
  > = {
    createdAt: new Date(1_700_000_000_000),
    description: { en: `${type} keychain description` },
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
    name: { en: `Test ${type} keychain` },
    ownerId: generateId(),
    updatedAt: new Date(1_700_000_002_000),
    users: [{ addedAt: new Date(1_700_000_003_000), userId: generateUserId() }],
  };

  return match(type)
    .with("Consumer", () => ({
      ...commonKeychainProperties,
      id: generateId<ConsumerKeychainId>(),
    }))
    .with("Knode API", () => ({
      ...commonKeychainProperties,
      id: generateId<KnodeApiKeychainId>(),
    }))
    .with("Producer", () => ({
      ...commonKeychainProperties,
      id: generateId<ProducerKeychainId>(),
    }))
    .exhaustive();
}

const consumerKeychain: ConsumerKeychain = createMockKeychain("Consumer");
const knodeApiKeychain: KnodeApiKeychain = createMockKeychain("Knode API");
const producerKeychain: ProducerKeychain = createMockKeychain("Producer");

describe("Consumer Keychain protobuf converters", () => {
  it("ConsumerKeychain roundtrips through V1", () => {
    expect(
      fromConsumerKeychainV1(toConsumerKeychainV1(consumerKeychain)),
    ).toEqual(consumerKeychain);
  });

  it("toConsumerKeychainV1 encodes dates as epoch millis", () => {
    const v1 = toConsumerKeychainV1(consumerKeychain);
    expect(v1.createdAt).toBe(consumerKeychain.createdAt.getTime());
    expect(v1.updatedAt).toBe(consumerKeychain.updatedAt.getTime());
    expect(v1.keys[0]?.createdAt).toBe(
      consumerKeychain.keys[0]?.createdAt.getTime(),
    );
    expect(v1.users[0]?.addedAt).toBe(
      consumerKeychain.users[0]?.addedAt.getTime(),
    );
  });
});

describe("Knode API Keychain protobuf converters", () => {
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

describe("Producer Keychain protobuf converters", () => {
  it("ProducerKeychain roundtrips through V1", () => {
    expect(
      fromProducerKeychainV1(toProducerKeychainV1(producerKeychain)),
    ).toEqual(producerKeychain);
  });

  it("toProducerKeychainV1 encodes dates as epoch millis", () => {
    const v1 = toProducerKeychainV1(producerKeychain);
    expect(v1.createdAt).toBe(producerKeychain.createdAt.getTime());
    expect(v1.updatedAt).toBe(producerKeychain.updatedAt.getTime());
    expect(v1.keys[0]?.createdAt).toBe(
      producerKeychain.keys[0]?.createdAt.getTime(),
    );
    expect(v1.users[0]?.addedAt).toBe(
      producerKeychain.users[0]?.addedAt.getTime(),
    );
  });
});
