import {
  fromExternalResourceV1,
  fromOptionalExternalResourceV1,
} from "@knodia/common-models/externalResource";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  PurposeFormSchemaVersionV1,
  PurposeStateV1,
  type PurposeV1,
} from "./generated/v1/purpose.ts";
import {
  type Purpose,
  PurposeFormAnswers,
  type PurposeFormSchemaVersion,
  type PurposeState,
} from "./purpose.ts";

export const fromPurposeV1 = (input: PurposeV1): Purpose => {
  assertRequired(input.consumer, "Purpose consumer is undefined");
  assertRequired(input.name, "Purpose name is undefined");
  assertRequired(input.description, "Purpose description is undefined");

  return {
    ...input,
    consumer: fromExternalResourceV1(input.consumer),
    createdAt: new Date(input.createdAt),
    description: input.description,
    eserviceId: unsafeBrandId(input.eserviceId),
    formAnswersJson: PurposeFormAnswers.parse(
      JSON.parse(input.formAnswersJson),
    ),
    formSchemaVersion: fromPurposeFormSchemaVersionV1(input.formSchemaVersion),
    id: unsafeBrandId(input.id),
    name: input.name,
    state: fromPurposeStateV1(input.state),
    suspendedByConsumerAt:
      input.suspendedByConsumerAt != null
        ? new Date(input.suspendedByConsumerAt)
        : null,
    suspendedByProducerAt:
      input.suspendedByProducerAt != null
        ? new Date(input.suspendedByProducerAt)
        : null,
    template: fromOptionalExternalResourceV1(input.template),
    updatedAt: new Date(input.updatedAt),
  };
};

const fromPurposeStateV1 = (input: PurposeStateV1): PurposeState =>
  match(input)
    .with(PurposeStateV1.ACTIVE, () => "Active" as const)
    .with(PurposeStateV1.SUSPENDED, () => "Suspended" as const)
    .with(PurposeStateV1.ARCHIVED, () => "Archived" as const)
    .with(PurposeStateV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized PurposeStateV1 value");
    })
    .exhaustive();

const fromPurposeFormSchemaVersionV1 = (
  input: PurposeFormSchemaVersionV1,
): PurposeFormSchemaVersion =>
  match(input)
    .with(PurposeFormSchemaVersionV1.V1_0, () => "1.0" as const)
    .with(PurposeFormSchemaVersionV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized PurposeFormSchemaVersionV1 value");
    })
    .exhaustive();
