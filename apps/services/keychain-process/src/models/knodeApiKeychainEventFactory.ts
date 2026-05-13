import type { CorrelationId, KeyId, UserId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";

import {
  type KnodeApiKeychain,
  toKnodeApiKeychainV1,
} from "@knodia/keychain-models";

export const createKnodeApiKeychainCreatedV1Event = (
  keychain: KnodeApiKeychain,
  correlationId: CorrelationId,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      knodeApiKeychain: toKnodeApiKeychainV1(keychain),
    },
    type: "KnodeApiKeychainCreatedV1",
  },
  streamId: keychain.id,
});

export const createKnodeApiKeychainUpdatedV1Event = (
  keychain: KnodeApiKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodeApiKeychain: toKnodeApiKeychainV1(keychain),
    },
    type: "KnodeApiKeychainUpdatedV1",
  },
  streamId: keychain.id,
});

export const createKnodeApiKeychainKeyAddedV1Event = (
  keychain: KnodeApiKeychain,
  kid: KeyId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      kid,
      knodeApiKeychain: toKnodeApiKeychainV1(keychain),
    },
    type: "KnodeApiKeychainKeyAddedV1",
  },
  streamId: keychain.id,
});

export const createKnodeApiKeychainMemberAddedV1Event = (
  keychain: KnodeApiKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodeApiKeychain: toKnodeApiKeychainV1(keychain),
      userId,
    },
    type: "KnodeApiKeychainMemberAddedV1",
  },
  streamId: keychain.id,
});

export const createKnodeApiKeychainMemberRemovedV1Event = (
  keychain: KnodeApiKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodeApiKeychain: toKnodeApiKeychainV1(keychain),
      userId,
    },
    type: "KnodeApiKeychainMemberRemovedV1",
  },
  streamId: keychain.id,
});

export const createKnodeApiKeychainDeletedV1Event = (
  keychain: KnodeApiKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodeApiKeychain: toKnodeApiKeychainV1(keychain),
    },
    type: "KnodeApiKeychainDeletedV1",
  },
  streamId: keychain.id,
});
