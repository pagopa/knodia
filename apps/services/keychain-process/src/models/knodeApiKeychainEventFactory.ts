import type { CorrelationId } from "@knodia/common-models/ids";
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
