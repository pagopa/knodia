import type { RequiredAttributeGroup } from "@knodia/attribute-models";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { match } from "ts-pattern";

import { Agreement, AgreementState } from "./agreement.ts";
import {
  AgreementRequiredAttributeGroupV1,
  AgreementStateV1,
  type AgreementV1,
} from "./generated/v1/agreement.js";

const fromAgreementV1 = (input: AgreementV1): Agreement => ({
  ...input,
  consumerId: unsafeBrandId(input.consumerId),
  createdAt: new Date(input.createdAt),
  eserviceId: unsafeBrandId(input.eserviceId),
  eserviceVersionId: unsafeBrandId(input.eserviceVersionId),
  id: unsafeBrandId(input.id),
  producerId: unsafeBrandId(input.producerId),
  requiredAttributes: input.requiredAttributes.map(
    fromAgreementRequiredAttributeGroupV1,
  ),
  state: fromAgreementStateV1(input.state),
  updatedAt: new Date(input.updatedAt),
});

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

const fromAgreementRequiredAttributeGroupV1 = (
  input: AgreementRequiredAttributeGroupV1,
): RequiredAttributeGroup => input.attributes;
