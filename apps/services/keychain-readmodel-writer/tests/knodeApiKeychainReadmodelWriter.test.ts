/* eslint-disable max-lines-per-function */
import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { generateUserId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  keychainEvents,
  type KeychainKey,
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockKeychainKey,
  getMockKnodeApiKeychain,
  toExpectKnodeApiKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  consumer,
  knodeApiKeychainWriterService,
  producer,
  readmodelDb,
  topicName,
} from "./setup.ts";
import { getAllKnodeApiKeychains } from "./utils.ts";

describe("Knode API keychain read model writer tests", async () => {
  it("KnodeApiKeychainCreatedV1", async () => {
    const knodeApiKeychain = getMockKnodeApiKeychain();

    const eventData = protobufBinaryCodec(
      keychainEvents.KnodeApiKeychainCreatedV1,
    ).encode({
      knodeApiKeychain: toKnodeApiKeychainV1(knodeApiKeychain),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "KnodeApiKeychainCreatedV1",
      metadataVersion,
      producer,
      streamId: knodeApiKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllKnodeApiKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectKnodeApiKeychain(knodeApiKeychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<KnodeApiKeychain>);
  });

  it("KnodeApiKeychainKeyAddedV1", async () => {
    const knodeApiKeychain = getMockKnodeApiKeychain();

    await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
      knodeApiKeychain,
      0,
    );

    const key = getMockKeychainKey(1);

    const keychainWithKeyAdded: KnodeApiKeychain = {
      ...knodeApiKeychain,
      keys: [...knodeApiKeychain.keys, key],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.KnodeApiKeychainKeyAddedV1,
    ).encode({
      kid: key.kid,
      knodeApiKeychain: toKnodeApiKeychainV1(keychainWithKeyAdded),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "KnodeApiKeychainKeyAddedV1",
      metadataVersion,
      producer,
      streamId: knodeApiKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllKnodeApiKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectKnodeApiKeychain(keychainWithKeyAdded),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<KnodeApiKeychain>);
  });

  it("KnodeApiKeychainMemberRemovedV1", async () => {
    const userId = generateUserId();
    const knodeApiKeychain: KnodeApiKeychain = {
      ...getMockKnodeApiKeychain(),
      users: [{ addedAt: new Date(), userId }],
    };

    await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
      knodeApiKeychain,
      0,
    );

    const keychainWithMemberRemoved: KnodeApiKeychain = {
      ...knodeApiKeychain,
      users: [],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.KnodeApiKeychainMemberRemovedV1,
    ).encode({
      knodeApiKeychain: toKnodeApiKeychainV1(keychainWithMemberRemoved),
      userId,
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "KnodeApiKeychainMemberRemovedV1",
      metadataVersion,
      producer,
      streamId: knodeApiKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllKnodeApiKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectKnodeApiKeychain(keychainWithMemberRemoved),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<KnodeApiKeychain>);
  });

  it("KnodeApiKeychainMemberAddedV1", async () => {
    const knodeApiKeychain = getMockKnodeApiKeychain();

    await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
      knodeApiKeychain,
      0,
    );

    const userId = generateUserId();

    const keychainWithMemberAdded: KnodeApiKeychain = {
      ...knodeApiKeychain,
      users: [...knodeApiKeychain.users, { addedAt: new Date(), userId }],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.KnodeApiKeychainMemberAddedV1,
    ).encode({
      knodeApiKeychain: toKnodeApiKeychainV1(keychainWithMemberAdded),
      userId,
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "KnodeApiKeychainMemberAddedV1",
      metadataVersion,
      producer,
      streamId: knodeApiKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllKnodeApiKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectKnodeApiKeychain(keychainWithMemberAdded),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<KnodeApiKeychain>);
  });

  it("KnodeApiKeychainKeyRemovedV1", async () => {
    const keyToKeep = getMockKeychainKey(0);
    const keyToRemove = getMockKeychainKey(1);
    const existingKeys: KeychainKey[] = [keyToKeep, keyToRemove];
    const knodeApiKeychain: KnodeApiKeychain = {
      ...getMockKnodeApiKeychain(),
      keys: existingKeys,
    };

    await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
      knodeApiKeychain,
      0,
    );

    const keychainWithKeyRemoved: KnodeApiKeychain = {
      ...knodeApiKeychain,
      keys: [keyToKeep],
    };

    const eventData = protobufBinaryCodec(
      keychainEvents.KnodeApiKeychainKeyRemovedV1,
    ).encode({
      kid: keyToRemove.kid,
      knodeApiKeychain: toKnodeApiKeychainV1(keychainWithKeyRemoved),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "KnodeApiKeychainKeyRemovedV1",
      metadataVersion,
      producer,
      streamId: knodeApiKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllKnodeApiKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectKnodeApiKeychain(keychainWithKeyRemoved),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<KnodeApiKeychain>);
  });

  it("KnodeApiKeychainDeletedV1", async () => {
    const knodeApiKeychain = getMockKnodeApiKeychain();

    await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
      knodeApiKeychain,
      0,
    );

    const eventData = protobufBinaryCodec(
      keychainEvents.KnodeApiKeychainDeletedV1,
    ).encode({
      knodeApiKeychain: toKnodeApiKeychainV1(knodeApiKeychain),
    });

    await sendTestEvent({
      data: eventData,
      eventType: "KnodeApiKeychainDeletedV1",
      metadataVersion: 1,
      producer,
      streamId: knodeApiKeychain.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedKeychains = await getAllKnodeApiKeychains(readmodelDb);
    expect(retrievedKeychains.length).toBe(0);
  });
});
