import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";

import {
  type ConsumerKeychain,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";

export const createConsumerKeychainCreatedV1Event = (
  keychain: ConsumerKeychain,
  correlationId: CorrelationId,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(keychain),
    },
    type: "ConsumerKeychainCreatedV1",
  },
  streamId: keychain.id,
});

export const createConsumerKeychainDeletedV1Event = (
  keychain: ConsumerKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(keychain),
    },
    type: "ConsumerKeychainDeletedV1",
  },
  streamId: keychain.id,
});

export const createConsumerKeychainUpdatedV1Event = (
  keychain: ConsumerKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(keychain),
    },
    type: "ConsumerKeychainUpdatedV1",
  },
  streamId: keychain.id,
});
