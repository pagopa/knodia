import type { ConsumerKeychainWriterService } from "@knodia/db-readmodel-consumer-keychain/writer";
import type { KeychainEventEnvelopeV1 } from "@knodia/keychain-models";

import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { fromConsumerKeychainV1 } from "@knodia/keychain-models";
import { match } from "ts-pattern";

export async function handleKeychainEvent(
  message: KeychainEventEnvelopeV1,
  {
    consumerKeychainWriterService,
  }: {
    consumerKeychainWriterService: ConsumerKeychainWriterService;
  },
): Promise<void> {
  assertDataExistsInEvent(message, "keychain");

  return match(message)
    .with({ type: "ConsumerKeychainCreatedV1" }, async (msg) => {
      await consumerKeychainWriterService.upsertConsumerKeychain(
        fromConsumerKeychainV1(msg.data.keychain),
        message.version,
      );
    })
    .exhaustive();
}
