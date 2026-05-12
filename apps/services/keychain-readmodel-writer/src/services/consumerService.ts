import type {
  ConsumerKeychainWriterService,
  KnodeApiKeychainWriterService,
} from "@knodia/db-readmodel-keychain/services";

import { fromExternalResource } from "@knodia/common-models/externalResource";
import { type PurposeId, unsafeBrandId } from "@knodia/common-models/ids";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import {
  fromConsumerKeychainV1,
  fromKnodeApiKeychainV1,
  type KeychainEventEnvelopeV1,
} from "@knodia/keychain-models";
import { match, P } from "ts-pattern";

export async function handleKeychainEvent(
  message: KeychainEventEnvelopeV1,
  {
    consumerKeychainWriterService,
    knodeApiKeychainWriterService,
  }: {
    consumerKeychainWriterService: ConsumerKeychainWriterService;
    knodeApiKeychainWriterService: KnodeApiKeychainWriterService;
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
          purpose: fromExternalResource<PurposeId>(purpose),
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
          purpose: fromExternalResource<PurposeId>(purpose),
        },
        message.version,
      );
    })
    .with(
      {
        type: P.union(
          "KnodeApiKeychainCreatedV1",
          "KnodeApiKeychainKeyAddedV1",
        ),
      },
      async (msg) => {
        assertDataExistsInEvent(msg, "knodeApiKeychain");
        await knodeApiKeychainWriterService.upsertKnodeApiKeychain(
          fromKnodeApiKeychainV1(msg.data.knodeApiKeychain),
          message.version,
        );
      },
    )
    .exhaustive();
}
