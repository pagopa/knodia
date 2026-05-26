import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  keychainEvents,
  type KeychainKey,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockKeychainKey,
  getMockProducerKeychain,
  toExpectProducerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  consumer,
  producer,
  producerKeychainWriterService,
  readmodelDb,
  topicName,
} from "./setup.ts";
import { getAllProducerKeychains } from "./utils.ts";

describe("Keychain read model writer tests", async () => {
  it("ProducerKeychainCreatedV1", async () => {
    const producerKeychain = getMockProducerKeychain();

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainCreatedV1,
    ).encode({
      producerKeychain: toProducerKeychainV1(producerKeychain),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainCreatedV1",
      metadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(producerKeychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);
  });

  it("ProducerKeychainDeletedV1", async () => {
    const producerKeychain = getMockProducerKeychain();

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainDeletedV1,
    ).encode({
      producerKeychain: toProducerKeychainV1(producerKeychain),
    });

    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainDeletedV1",
      metadataVersion: 1,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(0);
  });

  it("ProducerKeychainUpdatedV1", async () => {
    const producerKeychain = getMockProducerKeychain();

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const updatedProducerKeychain: ProducerKeychain = {
      ...producerKeychain,
      description: { en: "Updated description" },
      name: { en: "Updated name" },
      updatedAt: new Date(),
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainUpdatedV1,
    ).encode({
      producerKeychain: toProducerKeychainV1(updatedProducerKeychain),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainUpdatedV1",
      metadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(updatedProducerKeychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);
  });

  it("ProducerKeychainKeyAddedV1", async () => {
    const producerKeychain = getMockProducerKeychain();

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const key = getMockKeychainKey(1);

    const keychainWithKeyAdded: ProducerKeychain = {
      ...producerKeychain,
      keys: [...producerKeychain.keys, key],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainKeyAddedV1,
    ).encode({
      kid: key.kid,
      producerKeychain: toProducerKeychainV1(keychainWithKeyAdded),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainKeyAddedV1",
      metadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(keychainWithKeyAdded),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);
  });

  it("ProducerKeychainKeyRemovedV1", async () => {
    const keyToKeep = getMockKeychainKey(0);
    const keyToRemove = getMockKeychainKey(1);
    const existingKeys: KeychainKey[] = [keyToKeep, keyToRemove];
    const producerKeychain: ProducerKeychain = {
      ...getMockProducerKeychain(),
      keys: existingKeys,
    };

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const keychainWithKeyRemoved: ProducerKeychain = {
      ...producerKeychain,
      keys: [keyToKeep],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainKeyRemovedV1,
    ).encode({
      kid: keyToRemove.kid,
      producerKeychain: toProducerKeychainV1(keychainWithKeyRemoved),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainKeyRemovedV1",
      metadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(keychainWithKeyRemoved),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);
  });
});
