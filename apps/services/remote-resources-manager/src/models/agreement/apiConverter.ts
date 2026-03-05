import type {
  API_AgreementConsumer,
  API_AgreementState,
} from "@knodia/agreement-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { API_KnodeId } from "@knodia/common-models/internalApi";
import { match } from "ts-pattern";

import type { API_Agreement, API_AgreementSeed } from "./api.ts";

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

export function toK2KAPI_AgreementSeed(
  agreementSeed: API_AgreementSeed,
): k2kGatewayApi.AgreementSeed {
  return {
    consumer: toK2KAPI_AgreementConsumer(agreementSeed.consumer),
    eserviceId: agreementSeed.eserviceId,
    eserviceVersionId: agreementSeed.eserviceVersionId,
  };
}

function toAPI_AgreementConsumer(
  consumer: k2kGatewayApi.AgreementConsumer,
): API_AgreementConsumer {
  return {
    id: consumer.id,
    knodeId: toAPI_KnodeId(consumer.knodeId),
  };
}

function toAPI_AgreementState(
  state: k2kGatewayApi.AgreementState,
): API_AgreementState {
  return match(state)
    .with("ACTIVE", () => "Active" as const)
    .with("SUSPENDED", () => "Suspended" as const)
    .with("ARCHIVED", () => "Archived" as const)
    .exhaustive();
}

function toAPI_KnodeId(knodeId: k2kGatewayApi.KnodeId): API_KnodeId {
  return match(knodeId)
    .with("ORION", () => "Orion" as const)
    .with("LYNX", () => "Lynx" as const)
    .exhaustive();
}

function toK2KAPI_AgreementConsumer(
  consumer: API_AgreementConsumer,
): k2kGatewayApi.AgreementConsumer {
  return {
    id: consumer.id,
    knodeId: toK2KAPI_KnodeId(consumer.knodeId),
  };
}

function toK2KAPI_KnodeId(knodeId: API_KnodeId): k2kGatewayApi.KnodeId {
  return match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();
}
