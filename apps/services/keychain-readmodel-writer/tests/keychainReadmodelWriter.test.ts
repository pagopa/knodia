import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  Keychain,
  keychainEvents,
  toKeychainV1,
} from "@knodia/keychain-models";
import { runTestConsumer, sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getAllKeychains,
  getMockKeychain,
  toExpectKeychain,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  kafkaConfig,
  processMessage,
  producer,
  readmodelDb,
  topicName,
} from "./setup.ts";

describe("Keychain read model writer tests", async () => {
  it("KeychainCreatedV1", async () => {
    const keychain = getMockKeychain();

    const eventData = protobufBinaryCodec(
      keychainEvents.KeychainCreatedV1,
    ).encode({
      keychain: toKeychainV1(keychain),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "KeychainCreatedV1",
      metadataVersion,
      producer,
      streamId: keychain.id,
      topicName,
    });

    await runTestConsumer(topicName, processMessage, kafkaConfig);

    const retrievedKeychains = await getAllKeychains(readmodelDb);

    expect(retrievedKeychains.length).toBe(1);
    expect(retrievedKeychains[0]).toEqual({
      data: toExpectKeychain(keychain),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Keychain>);
  });
});
