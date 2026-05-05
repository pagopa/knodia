import { fromExternalResourceV1 } from "@knodia/common-models/externalResource";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import { type Agreement, AgreementState } from "./agreement.ts";
import {
  AgreementStateV1,
  type AgreementV1,
} from "./generated/v1/agreement.ts";

export const fromAgreementV1 = (input: AgreementV1): Agreement => {
  assertRequired(input.consumer, "Agreement consumer is undefined");

  return {
    ...input,
    consumer: fromExternalResourceV1(input.consumer),
    createdAt: new Date(input.createdAt),
    eserviceId: unsafeBrandId(input.eserviceId),
    eserviceVersionId: unsafeBrandId(input.eserviceVersionId),
    id: unsafeBrandId(input.id),
    producerId: unsafeBrandId(input.producerId),
    state: fromAgreementStateV1(input.state),
    suspendedByConsumerAt:
      input.suspendedByConsumerAt != null
        ? new Date(input.suspendedByConsumerAt)
        : null,
    suspendedByProducerAt:
      input.suspendedByProducerAt != null
        ? new Date(input.suspendedByProducerAt)
        : null,
    updatedAt: new Date(input.updatedAt),
  };
};

const fromAgreementStateV1 = (input: AgreementStateV1): AgreementState =>
  match(input)
    .with(AgreementStateV1.ACTIVE, () => AgreementState.enum.Active)
    .with(AgreementStateV1.SUSPENDED, () => AgreementState.enum.Suspended)
    .with(AgreementStateV1.ARCHIVED, () => AgreementState.enum.Archived)
    .with(
      AgreementStateV1.PENDING_CONSUMER_OPERATOR_IDENTIFICATION,
      () => AgreementState.enum.PendingConsumerOperatorIdentification,
    )
    .with(AgreementStateV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized AgreementStateV1 value");
    })
    .exhaustive();
