import type { agreementProcessApi } from "@knodia/agreement-process-client";

import { match } from "ts-pattern";

import type {
  API_AgreementConsumer,
  API_AgreementSeed,
  API_KnodeId,
} from "./api.ts";

export function toProcessAPI_AgreementSeed(
  agreementSeed: API_AgreementSeed,
): agreementProcessApi.AgreementSeed {
  return {
    consumer: toProcessAPI_AgreementConsumer(agreementSeed.consumer),
    eserviceId: agreementSeed.eserviceId,
    eserviceVersionId: agreementSeed.eserviceVersionId,
  };
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
