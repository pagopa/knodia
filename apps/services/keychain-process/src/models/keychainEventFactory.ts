import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  CorrelationId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";

import {
  type ConsumerKeychain,
  toConsumerKeychainLinkedPurposeV1,
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

export const createConsumerKeychainMemberAddedV1Event = (
  keychain: ConsumerKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(keychain),
      userId,
    },
    type: "ConsumerKeychainMemberAddedV1",
  },
  streamId: keychain.id,
});

export const createConsumerKeychainMemberRemovedV1Event = (
  keychain: ConsumerKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(keychain),
      userId,
    },
    type: "ConsumerKeychainMemberRemovedV1",
  },
  streamId: keychain.id,
});

export const createConsumerKeychainPurposeLinkedV1Event = ({
  consumerKeychain,
  correlationId,
  currentMetadataVersion,
  linkedAt,
  purpose,
}: {
  consumerKeychain: ConsumerKeychain;
  correlationId: CorrelationId;
  currentMetadataVersion: number;
  linkedAt: Date;
  purpose: ExternalResource<PurposeId>;
}): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      linkedAt: linkedAt.getTime(),
      purpose: toConsumerKeychainLinkedPurposeV1(purpose),
    },
    type: "ConsumerKeychainPurposeLinkedV1",
  },
  streamId: consumerKeychain.id,
});

export const createConsumerKeychainPurposeUnlinkedV1Event = ({
  consumerKeychain,
  correlationId,
  currentMetadataVersion,
  purpose,
}: {
  consumerKeychain: ConsumerKeychain;
  correlationId: CorrelationId;
  currentMetadataVersion: number;
  purpose: ExternalResource<PurposeId>;
}): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      purpose: toConsumerKeychainLinkedPurposeV1(purpose),
    },
    type: "ConsumerKeychainPurposeUnlinkedV1",
  },
  streamId: consumerKeychain.id,
});
