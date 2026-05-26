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

import { consumer, producer, readmodelDb, topicName } from "./setup.ts";
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
});
