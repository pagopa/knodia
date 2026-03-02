import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";

import type { ConsumerKeychain } from "../src/consumerKeychain.ts";

import { ConsumerKeychainEventV1 } from "../src/consumerKeychainEvent.ts";
import { toConsumerKeychainV1 } from "../src/consumerKeychainProtobufConverterToV1.ts";
import { ConsumerKeychainCreatedV1 } from "../src/generated/v1/consumerKeychainEvents.ts";

describe("ConsumerKeychainEventV1 codec", () => {
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
        userId: generateId(),
      },
    ],
    name: { en: "Test Consumer keychain" },
    ownerId: generateId(),
    purposes: [generateId()],
    updatedAt: new Date(1),
    users: [generateId()],
  };

  it("encodes and decodes a ConsumerKeychainCreatedV1 payload (ConsumerKeychainEventV1 full codec)", () => {
    const event: ConsumerKeychainEventV1 = {
      data: {
        consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      },
      type: "ConsumerKeychainCreatedV1",
    };
    const encoded = ConsumerKeychainEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "ConsumerKeychainCreatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = ConsumerKeychainEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes a ConsumerKeychainCreatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(ConsumerKeychainCreatedV1);
    const value = {
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("decodes a KafkaMessageEnvelope with ConsumerKeychainEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: ConsumerKeychainEventV1 = {
      data: {
        consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      },
      type: "ConsumerKeychainCreatedV1",
    };

    // This the encoding we perform when writing into the event store DB
    const { data, type } = ConsumerKeychainEventV1.encode(event);

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

    const decoded = KafkaMessageEnvelope(ConsumerKeychainEventV1).decode(
      envelope,
    );
    expect(decoded).toMatchObject(event);
  });
});
