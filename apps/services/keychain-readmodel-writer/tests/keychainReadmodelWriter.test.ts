import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  ConsumerKeychain,
  keychainEvents,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { runTestConsumer, sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockConsumerKeychain,
  toExpectConsumerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  kafkaConfig,
  processMessage,
  producer,
  readmodelDb,
  topicName,
} from "./setup.ts";
import { getAllConsumerKeychains } from "./utils.ts";

describe("Consumer keychain read model writer tests", async () => {
  it("ConsumerKeychainCreatedV1", async () => {
    const consumerKeychain = getMockConsumerKeychain();

    const eventData = protobufBinaryCodec(
      keychainEvents.ConsumerKeychainCreatedV1,
    ).encode({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "ConsumerKeychainCreatedV1",
      metadataVersion,
      producer,
      streamId: consumerKeychain.id,
      topicName,
    });

    await runTestConsumer(topicName, processMessage, kafkaConfig);

    const retrievedKeychains = await getAllConsumerKeychains(readmodelDb);

    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectConsumerKeychain(consumerKeychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ConsumerKeychain>);
  });
});
