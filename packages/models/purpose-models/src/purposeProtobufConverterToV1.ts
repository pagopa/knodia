import { match } from "ts-pattern";

import type { Purpose } from "./purpose.ts";

import { PurposeStateV1, type PurposeV1 } from "./generated/v1/purpose.ts";

const toPurposeStateV1 = (state: Purpose["state"]): PurposeStateV1 =>
  match(state)
    .with("Active", () => PurposeStateV1.ACTIVE)
    .with("Suspended", () => PurposeStateV1.SUSPENDED)
    .with("Archived", () => PurposeStateV1.ARCHIVED)
    .exhaustive();

export const toPurposeV1 = (purpose: Purpose): PurposeV1 => ({
  ...purpose,
  createdAt: purpose.createdAt.getTime(),
  formAnswers: purpose.formAnswers as Record<string, string>,
  state: toPurposeStateV1(purpose.state),
  updatedAt: purpose.updatedAt.getTime(),
});
