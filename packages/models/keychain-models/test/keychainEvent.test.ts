import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";

import type { Keychain } from "../src/keychain.ts";

import { KeychainCreatedV1 } from "../src/generated/v1/keychainEvents.ts";
import { KeychainEventV1 } from "../src/keychainEvent.ts";
import { toKeychainV1 } from "../src/keychainProtobufConverterToV1.ts";

describe("KeychainEventV1 codec", () => {
  const keychain: Keychain = {
    createdAt: new Date(1),
    description: { en: "Keychain description" },
    id: generateId(),
    keys: [
      {
        algorithm: "RS256",
        createdAt: new Date(1),
        encodedPem: "-----BEGIN CERTIFICATE-----xyz",
        format: "jwk",
        kid: "kid-1",
        name: { en: "Primary key" },
        use: "sig",
        userId: generateId(),
      },
    ],
    kind: "Producer",
    name: { en: "Test Keychain" },
    ownerId: generateId(),
    purposes: [generateId()],
    updatedAt: new Date(1),
    users: [generateId()],
  };

  it("encodes and decodes a KeychainCreatedV1 payload (KeychainEventV1 full codec)", () => {
    const event: KeychainEventV1 = {
      data: {
        keychain: toKeychainV1(keychain),
      },
      type: "KeychainCreatedV1",
    };
    const encoded = KeychainEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "KeychainCreatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = KeychainEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes a KeychainCreatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(KeychainCreatedV1);
    const value = {
      keychain: toKeychainV1(keychain),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("decodes a KafkaMessageEnvelope with KeychainEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: KeychainEventV1 = {
      data: {
        keychain: toKeychainV1(keychain),
      },
      type: "KeychainCreatedV1",
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
