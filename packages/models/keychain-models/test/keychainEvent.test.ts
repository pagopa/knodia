import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import {
  generateId,
  generateUserId,
  unsafeBrandKeyId,
} from "@knodia/common-models/ids";
import {
  protobufBinaryCodec,
  type ProtobufCodec,
} from "@knodia/common-models/protobuf";
import { Purpose, toPurposeV1 } from "@knodia/purpose-models";
import { match } from "ts-pattern";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import type { ConsumerKeychain } from "../src/keychain.ts";

import {
  ConsumerKeychainCreatedV1,
  ConsumerKeychainDeletedV1,
  ConsumerKeychainMemberAddedV1,
  ConsumerKeychainMemberRemovedV1,
  ConsumerKeychainPurposeLinkedV1,
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
    users: [generateUserId()],
  };

  const purpose: Purpose = {
    ...zocker(Purpose).generate(),
    // zocker generates non-JSON-serializable values for Record<string, unknown>;
    // override with a realistic JSON-safe object
    formAnswersJson: {
      checked: true,
      count: 42,
      nested: { deep: "value" },
      options: ["a", "b", "c"],
      question1: "answer1",
    },
  };
  const purposeV1 = toPurposeV1(purpose);
  const consumerKeychainV1 = toConsumerKeychainV1(consumerKeychain);
  const defaultData = { consumerKeychain: consumerKeychainV1 };
  const cases = [
    {
      data: defaultData,
      message: ConsumerKeychainCreatedV1,
      type: "ConsumerKeychainCreatedV1" as const,
    },
    {
      data: defaultData,
      message: ConsumerKeychainDeletedV1,
      type: "ConsumerKeychainDeletedV1" as const,
    },
    {
      data: defaultData,
      message: ConsumerKeychainUpdatedV1,
      type: "ConsumerKeychainUpdatedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        linkedAt: new Date().getTime(),
        purpose: purposeV1,
      },
      message: ConsumerKeychainPurposeLinkedV1,
      type: "ConsumerKeychainPurposeLinkedV1" as const,
    },
    {
      data: {
        consumerKeychain: consumerKeychainV1,
        linkedAt: new Date().getTime(),
        purpose: purposeV1,
      },
      message: ConsumerKeychainPurposeLinkedV1,
      type: "ConsumerKeychainPurposeLinkedV1" as const,
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
        .with({ type: "ConsumerKeychainMemberAddedV1" }, ({ data, type }) =>
          testFullCodec({ data, type }),
        )
        .with({ type: "ConsumerKeychainMemberRemovedV1" }, ({ data, type }) =>
          testFullCodec({ data, type }),
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
        .with({ type: "ConsumerKeychainMemberAddedV1" }, ({ data, message }) =>
          testProtobufCodec(message, data),
        )
        .with(
          { type: "ConsumerKeychainMemberRemovedV1" },
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
