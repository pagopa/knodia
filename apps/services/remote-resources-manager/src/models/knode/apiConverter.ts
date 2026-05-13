import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { match } from "ts-pattern";

export function toAPI_KnodeId(knodeId: k2kGatewayApi.KnodeId): API_KnodeId {
  return match(knodeId)
    .with("ORION", () => "Orion" as const)
    .with("LYNX", () => "Lynx" as const)
    .exhaustive();
}

export function toK2KAPI_KnodeId(knodeId: API_KnodeId): k2kGatewayApi.KnodeId {
  return match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();
}
