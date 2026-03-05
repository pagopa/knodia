import type {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { match } from "ts-pattern";

export const toK2KVersionState = (
  state: API_EserviceVersionState,
): k2kGatewayApi.EserviceVersionState =>
  match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();

export const toK2KMode = (mode: API_EserviceMode): k2kGatewayApi.EserviceMode =>
  match(mode)
    .with("ProvideData", () => "PROVIDE_DATA" as const)
    .with("ReceiveData", () => "RECEIVE_DATA" as const)
    .exhaustive();

export const toK2KAccessTokenType = (
  tokenType: API_AccessTokenType,
): k2kGatewayApi.AccessTokenType =>
  match(tokenType)
    .with("Bearer", () => "BEARER" as const)
    .with("DPoP", () => "DPOP" as const)
    .exhaustive();
