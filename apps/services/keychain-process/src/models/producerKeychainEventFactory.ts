import type {
  CorrelationId,
  EserviceId,
  KeyId,
  UserId,
} from "@knodia/common-models/ids";
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

export const createProducerKeychainDeletedV1Event = (
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
    type: "ProducerKeychainDeletedV1",
  },
  streamId: keychain.id,
});

export const createProducerKeychainMemberAddedV1Event = (
  keychain: ProducerKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      producerKeychain: toProducerKeychainV1(keychain),
      userId,
    },
    type: "ProducerKeychainMemberAddedV1",
  },
  streamId: keychain.id,
});

export const createProducerKeychainMemberRemovedV1Event = (
  keychain: ProducerKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      producerKeychain: toProducerKeychainV1(keychain),
      userId,
    },
    type: "ProducerKeychainMemberRemovedV1",
  },
  streamId: keychain.id,
});

export const createProducerKeychainEserviceLinkedV1Event = ({
  correlationId,
  currentMetadataVersion,
  eserviceId,
  linkedAt,
  producerKeychain,
}: {
  correlationId: CorrelationId;
  currentMetadataVersion: number;
  eserviceId: EserviceId;
  linkedAt: Date;
  producerKeychain: ProducerKeychain;
}): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      eserviceId,
      linkedAt: linkedAt.getTime(),
      producerKeychain: toProducerKeychainV1(producerKeychain),
    },
    type: "ProducerKeychainEserviceLinkedV1",
  },
  streamId: producerKeychain.id,
});

export const createProducerKeychainEserviceUnlinkedV1Event = ({
  correlationId,
  currentMetadataVersion,
  eserviceId,
  producerKeychain,
}: {
  correlationId: CorrelationId;
  currentMetadataVersion: number;
  eserviceId: EserviceId;
  producerKeychain: ProducerKeychain;
}): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      eserviceId,
      producerKeychain: toProducerKeychainV1(producerKeychain),
    },
    type: "ProducerKeychainEserviceUnlinkedV1",
  },
  streamId: producerKeychain.id,
});

export const createProducerKeychainKeyAddedV1Event = (
  keychain: ProducerKeychain,
  kid: KeyId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      kid,
      producerKeychain: toProducerKeychainV1(keychain),
    },
    type: "ProducerKeychainKeyAddedV1",
  },
  streamId: keychain.id,
});

export const createProducerKeychainKeyRemovedV1Event = (
  keychain: ProducerKeychain,
  kid: KeyId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      kid,
      producerKeychain: toProducerKeychainV1(keychain),
    },
    type: "ProducerKeychainKeyRemovedV1",
  },
  streamId: keychain.id,
});
