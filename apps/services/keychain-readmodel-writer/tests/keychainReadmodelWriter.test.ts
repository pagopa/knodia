import type { PurposeId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type ExternalResource,
  generateExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  keychainEvents,
  toConsumerKeychainLinkedPurposeV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockConsumerKeychain,
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
    const purpose: ExternalResource<PurposeId> = {
      id: generateExternalId(),
      knodeId: "Orion",
    };

    await keychainWriterService.upsertConsumerKeychain(consumerKeychain, 0);

    const eventData = protobufBinaryCodec(
      keychainEvents.ConsumerKeychainPurposeLinkedV1,
    ).encode({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      linkedAt: new Date().getTime(),
      purpose,
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
        purpose: {
          id: unsafeBrandExternalId(purpose.id),
          knodeId: purpose.knodeId,
        },
      },
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ConsumerKeychainPurpose>);
  });
});
