import type { ConsumerKeychainEventEnvelopeV1 } from "@knodia/consumer-keychain-models";
import type { ConsumerKeychainWriterService } from "@knodia/db-readmodel-consumer-keychain/writer";

import { fromConsumerKeychainV1 } from "@knodia/consumer-keychain-models";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { match } from "ts-pattern";

export async function handleConsumerKeychainEvent(
  message: ConsumerKeychainEventEnvelopeV1,
  writerService: ConsumerKeychainWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "consumerKeychain");

  return match(message)
    .with({ type: "ConsumerKeychainCreatedV1" }, async (msg) => {
      await writerService.upsertConsumerKeychain(
        fromConsumerKeychainV1(msg.data.consumerKeychain),
        message.version,
      );
    })
    .exhaustive();
}
