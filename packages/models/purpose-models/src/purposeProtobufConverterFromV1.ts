import {
  type ExternalResource,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import {
  KnodeId,
  OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  type PurposeConsumerV1,
  PurposeStateV1,
  type PurposeV1,
} from "./generated/v1/purpose.ts";
import { Purpose, PurposeFormAnswers, PurposeState } from "./purpose.ts";

export const fromPurposeV1 = (input: PurposeV1): Purpose => {
  assertRequired(input.consumer, "Purpose consumer is undefined");
  assertRequired(input.name, "Purpose name is undefined");
  assertRequired(input.description, "Purpose description is undefined");

  return {
    ...input,
    consumer: fromPurposeConsumerV1(input.consumer),
    createdAt: new Date(input.createdAt),
    description: input.description,
    eserviceId: unsafeBrandId(input.eserviceId),
    formAnswersJson: PurposeFormAnswers.parse(
      JSON.parse(input.formAnswersJson),
    ),
    id: unsafeBrandId(input.id),
    name: input.name,
    state: fromPurposeStateV1(input.state),
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

const fromPurposeConsumerV1 = (
  input: PurposeConsumerV1,
): ExternalResource<OrganizationId> => ({
  id: unsafeBrandExternalId(input.id),
  knodeId: KnodeId.parse(input.knodeId),
});
