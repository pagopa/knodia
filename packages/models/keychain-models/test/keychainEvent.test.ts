/* eslint-disable max-lines-per-function */
import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  generateUserId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import {
  protobufBinaryCodec,
  type ProtobufCodec,
} from "@knodia/common-models/protobuf";
import { match } from "ts-pattern";
import { describe, expect, it } from "vitest";

import type { ConsumerKeychainLinkedPurposeV1 } from "../src/generated/v1/keychain.ts";
import type {
  ConsumerKeychain,
  KnodeApiKeychain,
  ProducerKeychain,
} from "../src/keychain.ts";

import {
  ConsumerKeychainCreatedV1,
  ConsumerKeychainDeletedV1,
  ConsumerKeychainKeyAddedV1,
  ConsumerKeychainKeyRemovedV1,
  ConsumerKeychainMemberAddedV1,
  ConsumerKeychainMemberRemovedV1,
  ConsumerKeychainPurposeLinkedV1,
  ConsumerKeychainPurposeUnlinkedV1,
  ConsumerKeychainUpdatedV1,
  KnodeApiKeychainCreatedV1,
  KnodeApiKeychainDeletedV1,
  KnodeApiKeychainKeyAddedV1,
  KnodeApiKeychainKeyRemovedV1,
  KnodeApiKeychainMemberAddedV1,
  KnodeApiKeychainMemberRemovedV1,
  KnodeApiKeychainUpdatedV1,
  ProducerKeychainCreatedV1,
  ProducerKeychainDeletedV1,
  ProducerKeychainMemberAddedV1,
  ProducerKeychainMemberRemovedV1,
  ProducerKeychainUpdatedV1,
} from "../src/generated/v1/keychainEvents.ts";
import { KeychainEventV1 } from "../src/keychainEvent.ts";
import {
  toConsumerKeychainV1,
  toKnodeApiKeychainV1,
  toProducerKeychainV1,
} from "../src/keychainProtobufConverterToV1.ts";

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
    updatedAt: new Date(1),
    users: [{ addedAt: new Date(1), userId: generateUserId() }],
  };

  const knodeApiKeychain: KnodeApiKeychain = {
    createdAt: new Date(1),
    description: { en: "Knode API keychain description" },
    id: generateId(),
    keys: [],
    name: { en: "Test Knode API keychain" },
    ownerId: generateId(),
    updatedAt: new Date(1),
    users: [],
  };

  const producerKeychain: ProducerKeychain = {
    createdAt: new Date(1),
    description: { en: "Producer keychain description" },
    id: generateId(),
    keys: [],
    name: { en: "Test Producer keychain" },
    ownerId: generateId(),
    updatedAt: new Date(1),
    users: [],
  };

  const linkedPurposeV1: ConsumerKeychainLinkedPurposeV1 = {
    id: generateExternalId(),
    knodeId: "Orion",
  };
  const consumerKeychainV1 = toConsumerKeychainV1(consumerKeychain);
  const knodeApiKeychainV1 = toKnodeApiKeychainV1(knodeApiKeychain);
  const producerKeychainV1 = toProducerKeychainV1(producerKeychain);
  const defaultConsumerKeychainData = { consumerKeychain: consumerKeychainV1 };
  const defaultKnodeApiKeychainData = { knodeApiKeychain: knodeApiKeychainV1 };
  const defaultProducerKeychainData = { producerKeychain: producerKeychainV1 };

  const cases = [
    {
      data: defaultConsumerKeychainData,
      message: ConsumerKeychainCreatedV1,
      type: "ConsumerKeychainCreatedV1" as const,
    },
    {
      data: defaultConsumerKeychainData,
      message: ConsumerKeychainDeletedV1,
      type: "ConsumerKeychainDeletedV1" as const,
    },
    {
      data: defaultConsumerKeychainData,
      message: ConsumerKeychainUpdatedV1,
      type: "ConsumerKeychainUpdatedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        linkedAt: new Date().getTime(),
        purpose: linkedPurposeV1,
      },
      message: ConsumerKeychainPurposeLinkedV1,
      type: "ConsumerKeychainPurposeLinkedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        purpose: linkedPurposeV1,
      },
      message: ConsumerKeychainPurposeUnlinkedV1,
      type: "ConsumerKeychainPurposeUnlinkedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        userId: generateUserId(),
      },
      message: ConsumerKeychainMemberAddedV1,
      type: "ConsumerKeychainMemberAddedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        userId: generateUserId(),
      },
      message: ConsumerKeychainMemberRemovedV1,
      type: "ConsumerKeychainMemberRemovedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        kid: Buffer.from(crypto.randomUUID(), "utf-8").toString("base64"),
      },
      message: ConsumerKeychainKeyAddedV1,
      type: "ConsumerKeychainKeyAddedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        kid: Buffer.from(crypto.randomUUID(), "utf-8").toString("base64"),
      },
      message: ConsumerKeychainKeyRemovedV1,
      type: "ConsumerKeychainKeyRemovedV1" as const,
    },
    {
      data: defaultKnodeApiKeychainData,
      message: KnodeApiKeychainCreatedV1,
      type: "KnodeApiKeychainCreatedV1" as const,
    },
    {
      data: { knodeApiKeychain: knodeApiKeychainV1 },
      message: KnodeApiKeychainUpdatedV1,
      type: "KnodeApiKeychainUpdatedV1" as const,
    },
    {
      data: {
        kid: Buffer.from(crypto.randomUUID(), "utf-8").toString("base64"),
        knodeApiKeychain: knodeApiKeychainV1,
      },
      message: KnodeApiKeychainKeyAddedV1,
      type: "KnodeApiKeychainKeyAddedV1" as const,
    },
    {
      data: {
        knodeApiKeychain: knodeApiKeychainV1,
        userId: generateUserId(),
      },
      message: KnodeApiKeychainMemberAddedV1,
      type: "KnodeApiKeychainMemberAddedV1" as const,
    },
    {
      data: {
        knodeApiKeychain: knodeApiKeychainV1,
        userId: generateUserId(),
      },
      message: KnodeApiKeychainMemberRemovedV1,
      type: "KnodeApiKeychainMemberRemovedV1" as const,
    },
    {
      data: {
        kid: Buffer.from(crypto.randomUUID(), "utf-8").toString("base64"),
        knodeApiKeychain: knodeApiKeychainV1,
      },
      message: KnodeApiKeychainKeyRemovedV1,
      type: "KnodeApiKeychainKeyRemovedV1" as const,
    },
    {
      data: defaultKnodeApiKeychainData,
      message: KnodeApiKeychainDeletedV1,
      type: "KnodeApiKeychainDeletedV1" as const,
    },
    {
      data: defaultProducerKeychainData,
      message: ProducerKeychainCreatedV1,
      type: "ProducerKeychainCreatedV1" as const,
    },
    {
      data: defaultProducerKeychainData,
      message: ProducerKeychainUpdatedV1,
      type: "ProducerKeychainUpdatedV1" as const,
    },
    {
      data: defaultProducerKeychainData,
      message: ProducerKeychainDeletedV1,
      type: "ProducerKeychainDeletedV1" as const,
    },
    {
      data: {
        producerKeychain: producerKeychainV1,
        userId: generateUserId(),
      },
      message: ProducerKeychainMemberAddedV1,
      type: "ProducerKeychainMemberAddedV1" as const,
    },
    {
      data: {
        producerKeychain: producerKeychainV1,
        userId: generateUserId(),
      },
      message: ProducerKeychainMemberRemovedV1,
      type: "ProducerKeychainMemberRemovedV1" as const,
    },
  ] as const;

  it.each(cases)(
    "encodes and decodes a $type payload (KeychainEventV1 full codec)",
    (caseItem) => {
      function testFullCodec<E extends KeychainEventV1>(event: E) {
        const encoded = KeychainEventV1.encode(event);
        expect(encoded).toMatchObject({ type: event.type });
        expect(encoded.data).toBeInstanceOf(Uint8Array);

        const decoded = KeychainEventV1.decode(encoded);
        expect(decoded).toMatchObject(event);
      }

      match(caseItem)
        .with(
          { type: "ConsumerKeychainCreatedV1" },
          { type: "ConsumerKeychainDeletedV1" },
          { type: "ConsumerKeychainUpdatedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with({ type: "ConsumerKeychainPurposeLinkedV1" }, ({ data, type }) =>
          testFullCodec({ data, type }),
        )
        .with({ type: "ConsumerKeychainPurposeUnlinkedV1" }, ({ data, type }) =>
          testFullCodec({ data, type }),
        )
        .with(
          { type: "ConsumerKeychainMemberAddedV1" },
          { type: "ConsumerKeychainMemberRemovedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with(
          { type: "ConsumerKeychainKeyAddedV1" },
          { type: "ConsumerKeychainKeyRemovedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with(
          { type: "KnodeApiKeychainCreatedV1" },
          { type: "KnodeApiKeychainUpdatedV1" },
          { type: "KnodeApiKeychainDeletedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with(
          { type: "KnodeApiKeychainKeyAddedV1" },
          { type: "KnodeApiKeychainKeyRemovedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with(
          { type: "KnodeApiKeychainMemberAddedV1" },
          { type: "KnodeApiKeychainMemberRemovedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with(
          { type: "ProducerKeychainCreatedV1" },
          { type: "ProducerKeychainDeletedV1" },
          { type: "ProducerKeychainUpdatedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .with(
          { type: "ProducerKeychainMemberAddedV1" },
          { type: "ProducerKeychainMemberRemovedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .exhaustive();
    },
  );

  it.each(cases)(
    "encodes and decodes a $type payload (protobufBinaryCodec-only)",
    (caseItem) => {
      function testProtobufCodec<T>(message: ProtobufCodec<T>, data: T) {
        const codec = protobufBinaryCodec(message);
        const bytes = codec.encode(data);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(codec.decode(bytes)).toEqual(data);
      }

      match(caseItem)
        .with(
          { type: "ConsumerKeychainCreatedV1" },
          { type: "ConsumerKeychainDeletedV1" },
          { type: "ConsumerKeychainUpdatedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "ConsumerKeychainPurposeLinkedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "ConsumerKeychainPurposeUnlinkedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "ConsumerKeychainMemberAddedV1" },
          { type: "ConsumerKeychainMemberRemovedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "ConsumerKeychainKeyAddedV1" },
          { type: "ConsumerKeychainKeyRemovedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "KnodeApiKeychainCreatedV1" },
          { type: "KnodeApiKeychainUpdatedV1" },
          { type: "KnodeApiKeychainDeletedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "KnodeApiKeychainKeyAddedV1" },
          { type: "KnodeApiKeychainKeyRemovedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "KnodeApiKeychainMemberAddedV1" },
          { type: "KnodeApiKeychainMemberRemovedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "ProducerKeychainCreatedV1" },
          { type: "ProducerKeychainDeletedV1" },
          { type: "ProducerKeychainUpdatedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .with(
          { type: "ProducerKeychainMemberAddedV1" },
          { type: "ProducerKeychainMemberRemovedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .exhaustive();
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
