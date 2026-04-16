import type { AgreementWriterService } from "@knodia/db-readmodel-agreement/writer";

import {
  type AgreementEventEnvelopeV1,
  fromAgreementV1,
} from "@knodia/agreement-models";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { match, P } from "ts-pattern";

export async function handleAgreementEvent(
  message: AgreementEventEnvelopeV1,
  writerService: AgreementWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "agreement");

  return match(message)
    .with(
      {
        type: P.union(
          "AgreementActivatedV1",
          "AgreementCreatedPendingConsumerOperatorIdentificationV1",
          "AgreementSuspendedByConsumerV1",
          "AgreementSuspendedByProducerV1",
          "AgreementReactivatedByConsumerV1",
          "AgreementReactivatedByProducerV1",
        ),
      },
      async (msg) => {
        await writerService.upsertAgreement(
          fromAgreementV1(msg.data.agreement),
          message.version,
        );
      },
    )
    .exhaustive();
}
