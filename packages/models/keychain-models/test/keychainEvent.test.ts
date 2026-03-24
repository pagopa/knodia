import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId, generateUserId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";

import type { ConsumerKeychain } from "../src/keychain.ts";

import {
  ConsumerKeychainCreatedV1,
  ConsumerKeychainDeletedV1,
  ConsumerKeychainUpdatedV1,
} from "../src/generated/v1/keychainEvents.ts";
import { KeychainEventV1 } from "../src/keychainEvent.ts";
import { toConsumerKeychainV1 } from "../src/keychainProtobufConverterToV1.ts";

describe("KeychainEventV1 codec", () => {
  const consumerKeychain: ConsumerKeychain = {
    createdAt: new Date(1),
    description: { en: "Consumer keychain description" },
    id: generateId(),
    keys: [
      {
        algorithm: "RS256",
        createdAt: new Date(1),
        encodedPem: "-----BEGIN CERTIFICATE-----xyz",
        format: "jwk",
        kid: "kid-1",
        name: { en: "Primary key" },
        userId: generateUserId(),
      },
    ],
    name: { en: "Test Consumer keychain" },
    ownerId: generateId(),
    purposes: [generateId()],
    updatedAt: new Date(1),
    users: [generateUserId()],
  };

  const consumerKeychainV1 = toConsumerKeychainV1(consumerKeychain);
  const value = { consumerKeychain: consumerKeychainV1 };
  const cases = [
    {
      message: ConsumerKeychainCreatedV1,
      type: "ConsumerKeychainCreatedV1" as const,
    },
    {
      message: ConsumerKeychainDeletedV1,
      type: "ConsumerKeychainDeletedV1" as const,
    },
    {
      message: ConsumerKeychainUpdatedV1,
      type: "ConsumerKeychainUpdatedV1" as const,
    },
  ];

  it.each(cases)(
    "encodes and decodes a $type payload (KeychainEventV1 full codec)",
    ({ type }) => {
      const event: KeychainEventV1 = {
        data: value,
        type,
      };
      const encoded = KeychainEventV1.encode(event);
      expect(encoded).toMatchObject({ type });
      expect(encoded.data).toBeInstanceOf(Uint8Array);

      const decoded = KeychainEventV1.decode(encoded);
      expect(decoded).toMatchObject(event);
    },
  );

  it.each(cases)(
    "encodes and decodes a $type payload (protobufBinaryCodec-only)",
    ({ message }) => {
      const codec = protobufBinaryCodec(message);
      const bytes = codec.encode(value);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(codec.decode(bytes)).toEqual(value);
    },
  );

  it("decodes a KafkaMessageEnvelope with KeychainEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: KeychainEventV1 = {
      data: {
        consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      },
      type: "ConsumerKeychainCreatedV1",
    };

    // This the encoding we perform when writing into the event store DB
    const { data, type } = KeychainEventV1.encode(event);

    // This is the envelope as produced in Kafka by Debezium from the event store DB
    const envelope = {
      value: JSON.stringify({
        after: {
          correlation_id: generateId(),
          data: toHex(data),
          log_date: new Date().toISOString(),
          sequence_num: 1,
          stream_id: generateId(),
          type,
          version: 1,
        },
      }),
    };

    const decoded = KafkaMessageEnvelope(KeychainEventV1).decode(envelope);
    expect(decoded).toMatchObject(event);
  });
});
