import type { CorrelationId, KeyId } from "@knodia/common-models/ids";
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

export const createKnodeApiKeychainKeyRemovedV1Event = (
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
    type: "KnodeApiKeychainKeyRemovedV1",
  },
  streamId: keychain.id,
});
