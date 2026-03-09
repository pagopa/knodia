import type { API_AgreementConsumer } from "@knodia/agreement-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { API_KnodeId } from "@knodia/common-models/internalApi";
import { match } from "ts-pattern";

import type { API_AgreementSeed } from "./api.ts";

export function toK2KAPI_AgreementSeed(
  agreementSeed: API_AgreementSeed,
): k2kGatewayApi.AgreementSeed {
  return {
    consumer: toK2KAPI_AgreementConsumer(agreementSeed.consumer),
    eserviceId: agreementSeed.eserviceId,
    eserviceVersionId: agreementSeed.eserviceVersionId,
  };
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
