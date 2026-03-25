import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";

import {
  type ConsumerKeychain,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { type Purpose, toPurposeV1 } from "@knodia/purpose-models";

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

export const createConsumerKeychainPurposeLinkedV1Event = (
  consumerKeychain: ConsumerKeychain,
  purpose: Purpose,
  linkedAt: Date,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      linkedAt: linkedAt.getTime(),
      purpose: toPurposeV1(purpose),
    },
    type: "ConsumerKeychainPurposeLinkedV1",
  },
  streamId: consumerKeychain.id,
});
