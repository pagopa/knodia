import type { agreementProcessApi } from "@knodia/agreement-process-client";
import type { purposeProcessApi } from "@knodia/purpose-process-client";

import { match } from "ts-pattern";

import type { API_KnodeId } from "./api.ts";

export function toAPI_KnodeId(
  knodeId: agreementProcessApi.KnodeId | purposeProcessApi.KnodeId,
): API_KnodeId {
  return match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();
}
