import type { PurposeId } from "@knodia/common-models/ids";
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type ExternalResource,
  generateExternalId,
} from "@knodia/common-models/externalResource";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  keychainEvents,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockConsumerKeychain,
  getMockConsumerKeychainPurpose,
  toExpectConsumerKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  consumer,
  keychainWriterService,
  producer,
  readmodelDb,
  topicName,
} from "./setup.ts";
import {
  getAllConsumerKeychains,
  getConsumerKeychainPurposesByKeychainId,
} from "./utils.ts";

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
      await getConsumerKeychainPurposesByKeychainId(
        consumerKeychain.id,
        readmodelDb,
      );
    expect(retrievedConsumerKeychainPurposes.length).toBe(1);
    expect(retrievedConsumerKeychainPurposes[0]).toEqual({
      data: {
        consumerKeychainId: consumerKeychain.id,
        linkedAt: expect.any(Date),
        purpose,
      },
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ConsumerKeychainPurpose>);
  });

  it("ConsumerKeychainPurposeUnlinkedV1", async () => {
    const oldMetadataVersion = 2;
    const consumerKeychain = getMockConsumerKeychain();
    await keychainWriterService.upsertConsumerKeychain(
      consumerKeychain,
      oldMetadataVersion,
    );

    const purpose1: ExternalResource<PurposeId> = {
      id: generateExternalId(),
      knodeId: "Orion",
    };
    const consumerKeychainPurpose1: ConsumerKeychainPurpose = {
      ...getMockConsumerKeychainPurpose(),
      consumerKeychainId: consumerKeychain.id,
      purpose: purpose1,
    };
    await keychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurpose1,
      oldMetadataVersion,
    );

    const purpose2: ExternalResource<PurposeId> = {
      id: generateExternalId(),
      knodeId: "Orion",
    };
    const consumerKeychainPurpose2: ConsumerKeychainPurpose = {
      ...getMockConsumerKeychainPurpose(),
      consumerKeychainId: consumerKeychain.id,
      purpose: purpose2,
    };
    await keychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurpose2,
      oldMetadataVersion,
    );

    const eventData = protobufBinaryCodec(
      keychainEvents.ConsumerKeychainPurposeUnlinkedV1,
    ).encode({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      purpose: purpose1,
    });

    const newMetadataVersion = oldMetadataVersion + 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ConsumerKeychainPurposeUnlinkedV1",
      metadataVersion: newMetadataVersion,
      producer,
      streamId: consumerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllConsumerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectConsumerKeychain(consumerKeychain),
      metadata: { version: newMetadataVersion },
    } satisfies WithMetadata<ConsumerKeychain>);

    const retrievedConsumerKeychainPurposes =
      await consumerKeychainReadmodelService.getConsumerKeychainPurposesByKeychainId(
        consumerKeychain.id,
      );
    expect(retrievedConsumerKeychainPurposes.length).toBe(1);
    expect(retrievedConsumerKeychainPurposes[0]).toEqual({
      data: consumerKeychainPurpose2,
      metadata: { version: newMetadataVersion },
    } satisfies WithMetadata<ConsumerKeychainPurpose>);
  });
});
