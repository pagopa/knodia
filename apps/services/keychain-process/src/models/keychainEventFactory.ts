import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreKeychainEvent } from "@knodia/db-event-store-writer/keychain";
import type { ConsumerKeychain } from "@knodia/keychain-models";

import { toConsumerKeychainV1 } from "@knodia/keychain-models";

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
