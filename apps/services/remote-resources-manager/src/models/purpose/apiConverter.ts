import type { KnodeId } from "@knodia/common-models/ids";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { API_PurposeState } from "@knodia/purpose-models/api";

import { match } from "ts-pattern";

import type { API_Purpose } from "./api.ts";

import { toAPI_KnodeId } from "../knode/apiConverter.ts";

export function toAPI_Purpose(
  purpose: k2kGatewayApi.Purpose,
  knodeId: KnodeId,
): API_Purpose {
  return {
    consumer: {
      id: purpose.consumer.id,
      knodeId: toAPI_KnodeId(purpose.consumer.knodeId),
    },
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    id: purpose.id,
    knodeId,
    name: purpose.name,
    state: toAPI_PurposeState(purpose.state),
    updatedAt: purpose.updatedAt,
  };
}

export function toK2KAPI_PurposeState(
  state: API_PurposeState,
): k2kGatewayApi.PurposeState {
  return match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();
}

function toAPI_PurposeState(
  state: k2kGatewayApi.PurposeState,
): API_PurposeState {
  return match(state)
    .with("ACTIVE", () => "Active" as const)
    .with("SUSPENDED", () => "Suspended" as const)
    .with("ARCHIVED", () => "Archived" as const)
    .exhaustive();
}
