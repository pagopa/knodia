import type { KeychainWriterService } from "@knodia/db-readmodel-keychain/writer";
import type { KeychainEventEnvelopeV1 } from "@knodia/keychain-models";

import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { fromKeychainV1 } from "@knodia/keychain-models";
import { match } from "ts-pattern";

export async function handleKeychainEvent(
  message: KeychainEventEnvelopeV1,
  writerService: KeychainWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "keychain");

  return match(message)
    .with({ type: "KeychainCreated" }, async (msg) => {
      await writerService.upsertKeychain(
        fromKeychainV1(msg.data.keychain),
        message.version,
      );
    })
    .exhaustive();
}
