import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  keychainEvents,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { toPurposeV1 } from "@knodia/purpose-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockConsumerKeychain,
  getMockPurpose,
  toExpectConsumerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  consumer,
  consumerKeychainReadmodelService,
  keychainWriterService,
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

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllConsumerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectConsumerKeychain(consumerKeychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ConsumerKeychain>);
  });

  it("ConsumerKeychainPurposeLinkedV1", async () => {
    const consumerKeychain = getMockConsumerKeychain();
    const purpose = getMockPurpose();

    await keychainWriterService.upsertConsumerKeychain(consumerKeychain, 0);

    const eventData = protobufBinaryCodec(
      keychainEvents.ConsumerKeychainPurposeLinkedV1,
    ).encode({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      linkedAt: new Date().getTime(),
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ConsumerKeychainPurposeLinkedV1",
      metadataVersion,
      producer,
      streamId: consumerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllConsumerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectConsumerKeychain(consumerKeychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ConsumerKeychain>);

    const retrievedConsumerKeychainPurposes =
      await consumerKeychainReadmodelService.getConsumerKeychainPurposesByKeychainId(
        consumerKeychain.id,
      );
    expect(retrievedConsumerKeychainPurposes.length).toBe(1);
    expect(retrievedConsumerKeychainPurposes[0]).toEqual({
      data: {
        consumerKeychainId: consumerKeychain.id,
        linkedAt: expect.any(Date),
        purposeId: purpose.id,
      },
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ConsumerKeychainPurpose>);
  });
});
