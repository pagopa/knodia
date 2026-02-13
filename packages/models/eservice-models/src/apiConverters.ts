import { match } from "ts-pattern";

import type {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "./api.ts";
import type {
  EserviceAccessTokenType,
  EserviceMode,
  EserviceVersionState,
} from "./eservice.ts";

export function fromAPI_AccessTokenType(
  mode: API_AccessTokenType,
): EserviceAccessTokenType {
  return match(mode)
    .with("BEARER", () => "Bearer" as const)
    .with("DPOP", () => "DPoP" as const)
    .exhaustive();
}

export function fromAPI_EserviceMode(mode: API_EserviceMode): EserviceMode {
  return match(mode)
    .with("PROVIDE_DATA", () => "ProvideData" as const)
    .with("RECEIVE_DATA", () => "ReceiveData" as const)
    .exhaustive();
}

export function fromAPI_EserviceVersionState(
  state: API_EserviceVersionState,
): EserviceVersionState {
  return match(state)
    .with("ACTIVE", () => "Active" as const)
    .with("SUSPENDED", () => "Suspended" as const)
    .with("ARCHIVED", () => "Archived" as const)
    .exhaustive();
}

export function toAPI_AccessTokenType(
  mode: EserviceAccessTokenType,
): API_AccessTokenType {
  return match(mode)
    .with("Bearer", () => "BEARER" as const)
    .with("DPoP", () => "DPOP" as const)
    .exhaustive();
}

export function toAPI_EserviceMode(mode: EserviceMode): API_EserviceMode {
  return match(mode)
    .with("ProvideData", () => "PROVIDE_DATA" as const)
    .with("ReceiveData", () => "RECEIVE_DATA" as const)
    .exhaustive();
}

export function toAPI_EserviceVersionState(
  state: EserviceVersionState,
): API_EserviceVersionState {
  return match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();
}
