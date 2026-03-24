import type { KeychainWriterService } from "@knodia/db-readmodel-keychain/writer";

import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import {
  fromConsumerKeychainV1,
  type KeychainEventEnvelopeV1,
} from "@knodia/keychain-models";
import { match, P } from "ts-pattern";

export async function handleKeychainEvent(
  message: KeychainEventEnvelopeV1,
  {
    keychainWriterService,
  }: {
    keychainWriterService: KeychainWriterService;
  },
): Promise<void> {
  return match(message)
    .with(
      {
        type: P.union("ConsumerKeychainCreatedV1", "ConsumerKeychainUpdatedV1", "ConsumerKeychainMemberAddedV1"),
      },
      async (msg) => {
        assertDataExistsInEvent(msg, "consumerKeychain");
        await keychainWriterService.upsertConsumerKeychain(
          fromConsumerKeychainV1(msg.data.consumerKeychain),
          message.version,
        );
      },
    )
    .with({ type: "ConsumerKeychainDeletedV1" }, async (msg) => {
      assertDataExistsInEvent(msg, "consumerKeychain");
      await keychainWriterService.deleteConsumerKeychain(
        fromConsumerKeychainV1(msg.data.consumerKeychain).id,
        message.version,
      );
    })
    .exhaustive();
}
