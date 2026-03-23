import type {
  API_AgreementConsumer,
  API_AgreementState,
} from "@knodia/agreement-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { API_KnodeId } from "@knodia/common-models/internalApi";
import { match } from "ts-pattern";

import type { API_Agreement } from "./api.ts";

export function toAPI_Agreement(
  agreement: k2kGatewayApi.Agreement,
): API_Agreement {
  return {
    attributes: agreement.attributes,
    consumer: toAPI_AgreementConsumer(agreement.consumer),
    eserviceId: agreement.eserviceId,
    eserviceVersionId: agreement.eserviceVersionId,
    id: agreement.id,
    producerId: agreement.producerId,
    state: toAPI_AgreementState(agreement.state),
    updatedAt: agreement.updatedAt,
  };
}

export function toAPI_AgreementState(
  state: k2kGatewayApi.AgreementState,
): API_AgreementState {
  return match(state)
    .with("ACTIVE", () => "Active" as const)
    .with("SUSPENDED", () => "Suspended" as const)
    .with("ARCHIVED", () => "Archived" as const)
    .exhaustive();
}


export function toK2KAPI_AgreementState(
  state: API_AgreementState,
): k2kGatewayApi.AgreementState {
  return match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();
}

function toAPI_AgreementConsumer(
  consumer: k2kGatewayApi.AgreementConsumer,
): API_AgreementConsumer {
  return {
    id: consumer.id,
    knodeId: toAPI_KnodeId(consumer.knodeId),
  };
}

function toAPI_KnodeId(knodeId: k2kGatewayApi.KnodeId): API_KnodeId {
  return match(knodeId)
    .with("ORION", () => "Orion" as const)
    .with("LYNX", () => "Lynx" as const)
    .exhaustive();
}
