import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  keychainEvents,
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
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
});
