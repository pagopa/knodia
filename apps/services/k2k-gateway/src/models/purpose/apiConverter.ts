import type { KnodeId } from "@knodia/common-models/ids";
import type { purposeProcessApi } from "@knodia/purpose-process-client";

import { match } from "ts-pattern";

import { toAPI_KnodeId } from "../knode/apiConverter.ts";
import {
  type API_Purpose,
  type API_PurposeSeed,
  API_PurposeState,
} from "./api.ts";

export function toAPI_Purpose(purpose: purposeProcessApi.Purpose): API_Purpose {
  return {
    consumer: {
      id: purpose.consumer.id,
      knodeId: toAPI_KnodeId(purpose.consumer.knodeId),
    },
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    id: purpose.id,
    name: purpose.name,
    state: toAPI_PurposeState(purpose.state),
    updatedAt: purpose.updatedAt,
  };
}

export function toProcessAPI_PurposeSeed(
  purposeSeed: API_PurposeSeed,
  callerKnodeId: KnodeId,
): purposeProcessApi.PurposeSeed {
  return {
    consumer: toProcessAPI_PurposeConsumer(
      purposeSeed.consumerId,
      callerKnodeId,
    ),
    dailyCalls: purposeSeed.dailyCalls,
    description: purposeSeed.description,
    eserviceId: purposeSeed.eserviceId,
    formAnswersJson: purposeSeed.formAnswersJson,
    // Cast to the enum type — the purpose-process validates this and
    // returns 400 if the version is not supported
    formSchemaVersion:
      purposeSeed.formSchemaVersion as purposeProcessApi.PurposeFormSchemaVersion,
    name: purposeSeed.name,
  };
}

export function toProcessAPI_PurposeState(
  state: API_PurposeState,
): purposeProcessApi.PurposeState {
  return match(state)
    .with(API_PurposeState.enum.ACTIVE, () => "Active" as const)
    .with(API_PurposeState.enum.SUSPENDED, () => "Suspended" as const)
    .with(API_PurposeState.enum.ARCHIVED, () => "Archived" as const)
    .exhaustive();
}

function toAPI_PurposeState(
  state: purposeProcessApi.PurposeState,
): API_PurposeState {
  return match(state)
    .with("Active", () => API_PurposeState.enum.ACTIVE)
    .with("Suspended", () => API_PurposeState.enum.SUSPENDED)
    .with("Archived", () => API_PurposeState.enum.ARCHIVED)
    .exhaustive();
}

function toProcessAPI_PurposeConsumer(
  consumerId: string,
  callerKnodeId: KnodeId,
): purposeProcessApi.PurposeConsumer {
  return {
    id: consumerId,
    knodeId: callerKnodeId,
  };
}
