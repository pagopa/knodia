import type { ConsumerKeychainWriterService } from "@knodia/db-readmodel-keychain/services";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { KnodeId, unsafeBrandId } from "@knodia/common-models/ids";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import {
  fromConsumerKeychainV1,
  type KeychainEventEnvelopeV1,
} from "@knodia/keychain-models";
import { match, P } from "ts-pattern";

export async function handleKeychainEvent(
  message: KeychainEventEnvelopeV1,
  {
    consumerKeychainWriterService,
  }: {
    consumerKeychainWriterService: ConsumerKeychainWriterService;
  },
): Promise<void> {
  return match(message)
    .with(
      {
        type: P.union(
          "ConsumerKeychainCreatedV1",
          "ConsumerKeychainUpdatedV1",
          "ConsumerKeychainMemberAddedV1",
          "ConsumerKeychainMemberRemovedV1",
          "ConsumerKeychainKeyAddedV1",
          "ConsumerKeychainKeyRemovedV1",
        ),
      },
      async (msg) => {
        assertDataExistsInEvent(msg, "consumerKeychain");
        await consumerKeychainWriterService.upsertConsumerKeychain(
          fromConsumerKeychainV1(msg.data.consumerKeychain),
          message.version,
        );
      },
    )
    .with({ type: "ConsumerKeychainDeletedV1" }, async (msg) => {
      assertDataExistsInEvent(msg, "consumerKeychain");
      await consumerKeychainWriterService.deleteConsumerKeychain(
        fromConsumerKeychainV1(msg.data.consumerKeychain).id,
        message.version,
      );
    })
    .with({ type: "ConsumerKeychainPurposeLinkedV1" }, async (msg) => {
      assertDataExistsInEvent(msg, "consumerKeychain");
      assertDataExistsInEvent(msg, "purpose");

      const { consumerKeychain, purpose } = msg.data;
      await consumerKeychainWriterService.upsertConsumerKeychainPurpose(
        {
          consumerKeychainId: unsafeBrandId(consumerKeychain.id),
          linkedAt: new Date(msg.data.linkedAt),
          purpose: {
            id: unsafeBrandExternalId(purpose.id),
            knodeId: KnodeId.parse(purpose.knodeId),
          },
        },
        message.version,
      );
    })
    .with({ type: "ConsumerKeychainPurposeUnlinkedV1" }, async (msg) => {
      assertDataExistsInEvent(msg, "consumerKeychain");
      assertDataExistsInEvent(msg, "purpose");

      const { consumerKeychain, purpose } = msg.data;
      await consumerKeychainWriterService.deleteConsumerKeychainPurpose(
        {
          consumerKeychainId: unsafeBrandId(consumerKeychain.id),
          purpose: {
            id: unsafeBrandExternalId(purpose.id),
            knodeId: KnodeId.parse(purpose.knodeId),
          },
        },
        message.version,
      );
    })
    .exhaustive();
}
