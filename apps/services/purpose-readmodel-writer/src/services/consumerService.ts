import type { PurposeWriterService } from "@knodia/db-readmodel-purpose/writer";

import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import {
  fromPurposeV1,
  type PurposeEventEnvelopeV1,
} from "@knodia/purpose-models";
import { match, P } from "ts-pattern";

export async function handlePurposeEvent(
  message: PurposeEventEnvelopeV1,
  writerService: PurposeWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "purpose");

  return match(message)
    .with(
      {
        type: P.union(
          "PurposeActivatedV1",
          "PurposeSuspendedByConsumerV1",
          "PurposeSuspendedByProducerV1",
          "PurposeReactivatedByConsumerV1",
          "PurposeReactivatedByProducerV1",
        ),
      },
      async (msg) => {
        await writerService.upsertPurpose(
          fromPurposeV1(msg.data.purpose),
          message.version,
        );
      },
    )
    .exhaustive();
}
