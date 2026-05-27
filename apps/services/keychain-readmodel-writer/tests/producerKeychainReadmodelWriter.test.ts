import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

/* eslint-disable max-lines-per-function */
import {
  type EserviceId,
  generateId,
  generateUserId,
} from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  keychainEvents,
  type ProducerKeychain,
  type ProducerKeychainEservice,
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
import {
  getAllProducerKeychains,
  getProducerKeychainEservicesByKeychainId,
} from "./utils.ts";

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

  it("ProducerKeychainMemberAddedV1", async () => {
    const producerKeychain = getMockProducerKeychain();

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const userId = generateUserId();

    const keychainWithMemberAdded: ProducerKeychain = {
      ...producerKeychain,
      users: [...producerKeychain.users, { addedAt: new Date(), userId }],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainMemberAddedV1,
    ).encode({
      producerKeychain: toProducerKeychainV1(keychainWithMemberAdded),
      userId,
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainMemberAddedV1",
      metadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(keychainWithMemberAdded),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);
  });

  it("ProducerKeychainMemberRemovedV1", async () => {
    const userId = generateUserId();
    const producerKeychain: ProducerKeychain = {
      ...getMockProducerKeychain(),
      users: [{ addedAt: new Date(), userId }],
    };

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const keychainWithMemberRemoved: ProducerKeychain = {
      ...producerKeychain,
      users: [],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainMemberRemovedV1,
    ).encode({
      producerKeychain: toProducerKeychainV1(keychainWithMemberRemoved),
      userId,
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainMemberRemovedV1",
      metadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(keychainWithMemberRemoved),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);
  });

  it("ProducerKeychainEserviceLinkedV1", async () => {
    const producerKeychain = getMockProducerKeychain();
    const eserviceId = generateId<EserviceId>();

    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      0,
    );

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainEserviceLinkedV1,
    ).encode({
      eserviceId,
      linkedAt: new Date().getTime(),
      producerKeychain: toProducerKeychainV1(producerKeychain),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainEserviceLinkedV1",
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

    const retrievedEservices = await getProducerKeychainEservicesByKeychainId(
      producerKeychain.id,
      readmodelDb,
    );
    expect(retrievedEservices.length).toBe(1);
    expect(retrievedEservices[0]).toEqual({
      data: {
        eserviceId,
        linkedAt: expect.any(Date),
        producerKeychainId: producerKeychain.id,
      },
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<ProducerKeychainEservice>);
  });

  it("ProducerKeychainEserviceUnlinkedV1", async () => {
    const oldMetadataVersion = 2;
    const producerKeychain = getMockProducerKeychain();
    await producerKeychainWriterService.upsertProducerKeychain(
      producerKeychain,
      oldMetadataVersion,
    );

    const eserviceId1 = generateId<EserviceId>();
    const producerKeychainEservice1: ProducerKeychainEservice = {
      eserviceId: eserviceId1,
      linkedAt: new Date(),
      producerKeychainId: producerKeychain.id,
    };
    await producerKeychainWriterService.upsertProducerKeychainEservice(
      producerKeychainEservice1,
      oldMetadataVersion,
    );

    const eserviceId2 = generateId<EserviceId>();
    const producerKeychainEservice2: ProducerKeychainEservice = {
      eserviceId: eserviceId2,
      linkedAt: new Date(),
      producerKeychainId: producerKeychain.id,
    };
    await producerKeychainWriterService.upsertProducerKeychainEservice(
      producerKeychainEservice2,
      oldMetadataVersion,
    );

    const eventData = protobufBinaryCodec(
      keychainEvents.ProducerKeychainEserviceUnlinkedV1,
    ).encode({
      eserviceId: eserviceId1,
      producerKeychain: toProducerKeychainV1(producerKeychain),
    });

    const newMetadataVersion = oldMetadataVersion + 1;
    await sendTestEvent({
      data: eventData,
      eventType: "ProducerKeychainEserviceUnlinkedV1",
      metadataVersion: newMetadataVersion,
      producer,
      streamId: producerKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllProducerKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectProducerKeychain(producerKeychain),
      metadata: { version: newMetadataVersion },
    } satisfies WithMetadata<ProducerKeychain>);

    const retrievedEservices = await getProducerKeychainEservicesByKeychainId(
      producerKeychain.id,
      readmodelDb,
    );
    expect(retrievedEservices.length).toBe(1);
    expect(retrievedEservices[0]).toEqual({
      data: producerKeychainEservice2,
      metadata: { version: newMetadataVersion },
    } satisfies WithMetadata<ProducerKeychainEservice>);
  });
});
