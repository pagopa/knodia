import type { CorrelationId, KeyId, UserId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";

import {
  type KnodiaApiKeychain,
  toKnodiaApiKeychainV1,
} from "@knodia/keychain-models";

export const createKnodiaApiKeychainCreatedV1Event = (
  keychain: KnodiaApiKeychain,
  correlationId: CorrelationId,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
    },
    type: "KnodiaApiKeychainCreatedV1",
  },
  streamId: keychain.id,
});

export const createKnodiaApiKeychainDeletedV1Event = (
  keychain: KnodiaApiKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
    },
    type: "KnodiaApiKeychainDeletedV1",
  },
  streamId: keychain.id,
});

export const createKnodiaApiKeychainUpdatedV1Event = (
  keychain: KnodiaApiKeychain,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
    },
    type: "KnodiaApiKeychainUpdatedV1",
  },
  streamId: keychain.id,
});

export const createKnodiaApiKeychainMemberAddedV1Event = (
  keychain: KnodiaApiKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
      userId,
    },
    type: "KnodiaApiKeychainMemberAddedV1",
  },
  streamId: keychain.id,
});

export const createKnodiaApiKeychainMemberRemovedV1Event = (
  keychain: KnodiaApiKeychain,
  userId: UserId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
      userId,
    },
    type: "KnodiaApiKeychainMemberRemovedV1",
  },
  streamId: keychain.id,
});

export const createKnodiaApiKeychainKeyAddedV1Event = (
  keychain: KnodiaApiKeychain,
  kid: KeyId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      kid,
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
    },
    type: "KnodiaApiKeychainKeyAddedV1",
  },
  streamId: keychain.id,
});

export const createKnodiaApiKeychainKeyRemovedV1Event = (
  keychain: KnodiaApiKeychain,
  kid: KeyId,
  correlationId: CorrelationId,
  currentMetadataVersion: number,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion,
  event: {
    data: {
      kid,
      knodiaApiKeychain: toKnodiaApiKeychainV1(keychain),
    },
    type: "KnodiaApiKeychainKeyRemovedV1",
  },
  streamId: keychain.id,
});
