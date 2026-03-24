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
    .exhaustive();

export const toAgreementV1 = (agreement: Agreement): AgreementV1 => ({
  ...agreement,
  createdAt: agreement.createdAt.getTime(),
  state: toAgreementStateV1(agreement.state),
  updatedAt: agreement.updatedAt.getTime(),
});
