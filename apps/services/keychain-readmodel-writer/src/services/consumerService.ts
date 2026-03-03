/* eslint-disable no-restricted-imports */
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
  return match(message)
    .with({ type: "ConsumerKeychainCreatedV1" }, async (msg) => {
      assertDataExistsInEvent(msg, "consumerKeychain");
      await consumerKeychainWriterService.upsertConsumerKeychain(
        fromConsumerKeychainV1(msg.data.consumerKeychain),
        message.version,
      );
    })
    .exhaustive();
}
