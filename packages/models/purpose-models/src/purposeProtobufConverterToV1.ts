import { match } from "ts-pattern";

import type { Purpose } from "./purpose.ts";

import {
  type LocalizedTextV1,
  PurposeStateV1,
  type PurposeV1,
} from "./generated/v1/purpose.ts";

const toPurposeStateV1 = (state: Purpose["state"]): PurposeStateV1 =>
  match(state)
    .with("Active", () => PurposeStateV1.ACTIVE)
    .with("Suspended", () => PurposeStateV1.SUSPENDED)
    .with("Archived", () => PurposeStateV1.ARCHIVED)
    .exhaustive();

const toLocalizedTextV1 = (text: { en: string }): LocalizedTextV1 => ({
  en: text.en,
});

export const toPurposeV1 = (purpose: Purpose): PurposeV1 => ({
  consumer: {
    id: purpose.consumer.id,
    knodeId: purpose.consumer.knodeId,
  },
  createdAt: purpose.createdAt.getTime(),
  dailyCalls: purpose.dailyCalls,
  description: toLocalizedTextV1(purpose.description),
  eserviceId: purpose.eserviceId,
  formAnswers: purpose.formAnswers as Record<string, string>,
  id: purpose.id,
  name: toLocalizedTextV1(purpose.name),
  state: toPurposeStateV1(purpose.state),
  updatedAt: purpose.updatedAt.getTime(),
});
