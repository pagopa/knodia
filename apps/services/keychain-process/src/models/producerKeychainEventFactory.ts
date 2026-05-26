import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";

import {
  type ProducerKeychain,
  toProducerKeychainV1,
} from "@knodia/keychain-models";

export const createProducerKeychainCreatedV1Event = (
  keychain: ProducerKeychain,
  correlationId: CorrelationId,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      producerKeychain: toProducerKeychainV1(keychain),
    },
    type: "ProducerKeychainCreatedV1",
  },
  streamId: keychain.id,
});

export const createProducerKeychainUpdatedV1Event = (
  keychain: ProducerKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      producerKeychain: toProducerKeychainV1(keychain),
    },
    type: "ProducerKeychainUpdatedV1",
  },
  streamId: keychain.id,
});
