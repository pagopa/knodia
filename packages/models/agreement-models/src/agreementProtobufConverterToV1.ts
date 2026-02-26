import type { AttributeGroup } from "@knodia/attribute-models";

import { match } from "ts-pattern";

import type { Agreement, AgreementState } from "./agreement.ts";

import {
  AgreementRequiredAttributeGroupV1,
  AgreementStateV1,
  AgreementV1,
} from "./generated/v1/agreement.ts";

const toAgreementStateV1 = (state: AgreementState): AgreementStateV1 =>
  match(state)
    .with("Active", () => AgreementStateV1.ACTIVE)
    .with("Suspended", () => AgreementStateV1.SUSPENDED)
    .with("Archived", () => AgreementStateV1.ARCHIVED)
    .exhaustive();

export const toAgreementV1 = (agreement: Agreement): AgreementV1 => ({
  ...agreement,
  createdAt: agreement.createdAt.getTime(),
  requiredAttributes: agreement.requiredAttributes.map(
    toAgreementRequiredAttributeGroupV1,
  ),
  state: toAgreementStateV1(agreement.state),
  updatedAt: agreement.updatedAt.getTime(),
});

const toAgreementRequiredAttributeGroupV1 = (
  group: AttributeGroup,
  index: number,
): AgreementRequiredAttributeGroupV1 => ({
  attributes: group,
  groupId: index,
});
