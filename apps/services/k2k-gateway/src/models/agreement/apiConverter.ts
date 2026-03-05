import type { agreementProcessApi } from "@knodia/agreement-process-client";

import { match } from "ts-pattern";

import type {
  API_Agreement,
  API_AgreementConsumer,
  API_AgreementSeed,
  API_AgreementState,
  API_KnodeId,
} from "./api.ts";

export function toAPI_Agreement(
  agreement: agreementProcessApi.Agreement,
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

export function toProcessAPI_AgreementSeed(
  agreementSeed: API_AgreementSeed,
): agreementProcessApi.AgreementSeed {
  return {
    consumer: toProcessAPI_AgreementConsumer(agreementSeed.consumer),
    eserviceId: agreementSeed.eserviceId,
    eserviceVersionId: agreementSeed.eserviceVersionId,
  };
}

function toAPI_AgreementConsumer(
  consumer: agreementProcessApi.AgreementConsumer,
): API_AgreementConsumer {
  return {
    id: consumer.id,
    knodeId: toAPI_KnodeId(consumer.knodeId),
  };
}

function toAPI_AgreementState(
  state: agreementProcessApi.AgreementState,
): API_AgreementState {
  return match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();
}
function toAPI_KnodeId(knodeId: agreementProcessApi.KnodeId): API_KnodeId {
  return match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();
}

function toProcessAPI_AgreementConsumer(
  consumer: API_AgreementConsumer,
): agreementProcessApi.AgreementConsumer {
  return {
    id: consumer.id,
    knodeId: toProcessAPI_KnodeId(consumer.knodeId),
  };
}

function toProcessAPI_KnodeId(
  knodeId: API_KnodeId,
): agreementProcessApi.KnodeId {
  return match(knodeId)
    .with("ORION", () => "Orion" as const)
    .with("LYNX", () => "Lynx" as const)
    .exhaustive();
}
