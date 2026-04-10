import type { AgreementWriterService } from "@knodia/db-readmodel-agreement/writer";

import {
  type AgreementEventEnvelopeV1,
  fromAgreementV1,
} from "@knodia/agreement-models";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { match } from "ts-pattern";

export async function handleAgreementEvent(
  message: AgreementEventEnvelopeV1,
  writerService: AgreementWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "agreement");

  return match(message)
    .with(
      { type: "AgreementActivatedV1" },
      { type: "AgreementCreatedPendingConsumerOperatorIdentificationV1" },
      async (msg) => {
        await writerService.upsertAgreement(
          fromAgreementV1(msg.data.agreement),
          message.version,
        );
      },
    )
    .with({ type: "AgreementSuspendedByConsumerV1" }, async (msg) => {
      await writerService.upsertAgreement(
        fromAgreementV1(msg.data.agreement),
        message.version,
      );
    })
    .with({ type: "AgreementSuspendedByProducerV1" }, async (msg) => {
      await writerService.upsertAgreement(
        fromAgreementV1(msg.data.agreement),
        message.version,
      );
    })
    .with({ type: "AgreementReactivatedByConsumerV1" }, async (msg) => {
      await writerService.upsertAgreement(
        fromAgreementV1(msg.data.agreement),
        message.version,
      );
    })
    .with({ type: "AgreementReactivatedByProducerV1" }, async (msg) => {
      await writerService.upsertAgreement(
        fromAgreementV1(msg.data.agreement),
        message.version,
      );
    })
    .exhaustive();
}
