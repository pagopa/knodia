import type { ExternalResource } from "@knodia/common-models/externalResource";

import {
  KnodeId,
  OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import { Agreement, AgreementState } from "./agreement.ts";
import {
  AgreementConsumerV1,
  AgreementStateV1,
  type AgreementV1,
} from "./generated/v1/agreement.ts";

const fromAgreementV1 = (input: AgreementV1): Agreement => {
  assertRequired(input.consumer, "Agreement consumer is undefined");

  return {
    ...input,
    consumer: fromAgreementConsumerV1(input.consumer),
    createdAt: new Date(input.createdAt),
    eserviceId: unsafeBrandId(input.eserviceId),
    eserviceVersionId: unsafeBrandId(input.eserviceVersionId),
    id: unsafeBrandId(input.id),
    producerId: unsafeBrandId(input.producerId),
    state: fromAgreementStateV1(input.state),
    updatedAt: new Date(input.updatedAt),
  };
};

// TODO: knip workaround
console.log("🚀 ~ fromAgreementV1:", fromAgreementV1);

const fromAgreementStateV1 = (input: AgreementStateV1): AgreementState =>
  match(input)
    .with(AgreementStateV1.ACTIVE, () => AgreementState.enum.Active)
    .with(AgreementStateV1.SUSPENDED, () => AgreementState.enum.Suspended)
    .with(AgreementStateV1.ARCHIVED, () => AgreementState.enum.Archived)
    .with(AgreementStateV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized AgreementStateV1 value");
    })
    .exhaustive();

const fromAgreementConsumerV1 = (
  input: AgreementConsumerV1,
): ExternalResource<OrganizationId> => ({
  id: unsafeBrandId(input.id),
  knodeId: KnodeId.parse(input.knodeId),
});
