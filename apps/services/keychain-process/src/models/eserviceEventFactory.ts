import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";
import type { Keychain } from "@knodia/keychain-models";

import { toKeychainV1 } from "@knodia/keychain-models";

export const createKeychainCreatedV1Event = (
  keychain: Keychain,
  correlationId: CorrelationId,
): NewEventStoreKeychainEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      keychain: toKeychainV1(keychain),
    },
    type: "KeychainCreatedV1",
  },
  streamId: keychain.id,
});
