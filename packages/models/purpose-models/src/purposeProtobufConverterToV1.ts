import { match } from "ts-pattern";

import type {
  Purpose,
  PurposeFormSchemaVersion,
  PurposeState,
} from "./purpose.ts";

import {
  PurposeFormSchemaVersionV1,
  PurposeStateV1,
  type PurposeV1,
} from "./generated/v1/purpose.ts";

const toPurposeStateV1 = (state: PurposeState): PurposeStateV1 =>
  match(state)
    .with("Active", () => PurposeStateV1.ACTIVE)
    .with("Suspended", () => PurposeStateV1.SUSPENDED)
    .with("Archived", () => PurposeStateV1.ARCHIVED)
    .exhaustive();

const toPurposeFormSchemaVersionV1 = (
  version: PurposeFormSchemaVersion,
): PurposeFormSchemaVersionV1 =>
  match(version)
    .with("1.0", () => PurposeFormSchemaVersionV1.V1_0)
    .exhaustive();

export const toPurposeV1 = (purpose: Purpose): PurposeV1 => ({
  ...purpose,
  createdAt: purpose.createdAt.getTime(),
  formAnswersJson: JSON.stringify(purpose.formAnswersJson),
  formSchemaVersion: toPurposeFormSchemaVersionV1(purpose.formSchemaVersion),
  state: toPurposeStateV1(purpose.state),
  updatedAt: purpose.updatedAt.getTime(),
});
