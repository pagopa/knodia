import { match } from "ts-pattern";

import type { Agreement, AgreementState } from "./agreement.ts";

import {
  AgreementStateV1,
  type AgreementV1,
} from "./generated/v1/agreement.ts";

const toAgreementStateV1 = (state: AgreementState): AgreementStateV1 =>
  match(state)
    .with("Active", () => AgreementStateV1.ACTIVE)
    .with("Suspended", () => AgreementStateV1.SUSPENDED)
    .with("Archived", () => AgreementStateV1.ARCHIVED)
    .with(
      "PendingConsumerOperatorIdentification",
      () => AgreementStateV1.PENDING_CONSUMER_OPERATOR_IDENTIFICATION,
    )
    .exhaustive();

export const toAgreementV1 = (agreement: Agreement): AgreementV1 => ({
  ...agreement,
  createdAt: agreement.createdAt.getTime(),
  state: toAgreementStateV1(agreement.state),
  suspendedByConsumerAt: agreement.suspendedByConsumerAt?.getTime(),
  suspendedByProducerAt: agreement.suspendedByProducerAt?.getTime(),
  updatedAt: agreement.updatedAt.getTime(),
});
