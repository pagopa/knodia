import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { match } from "ts-pattern";

import type {
  API_AccessTokenType,
  API_CatalogEserviceDetail,
  API_CatalogEserviceSearchResult,
  API_EserviceMode,
  API_EserviceVersionState,
} from "./api.ts";

function toAPI_AccessTokenType(
  type: eserviceProcessApi.AccessTokenType,
): API_AccessTokenType {
  return match(type)
    .with("Bearer", () => "BEARER" as const)
    .with("DPoP", () => "DPOP" as const)
    .exhaustive();
}

function toAPI_EserviceMode(
  mode: eserviceProcessApi.EserviceMode,
): API_EserviceMode {
  return match(mode)
    .with("ProvideData", () => "PROVIDE_DATA" as const)
    .with("ReceiveData", () => "RECEIVE_DATA" as const)
    .exhaustive();
}

function toAPI_EserviceVersionState(
  state: eserviceProcessApi.EserviceVersionState,
): API_EserviceVersionState {
  return match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();
}

export const toAPI_CatalogEserviceSearchResult = (
  eservice: eserviceProcessApi.Eservice,
  eserviceVersion: eserviceProcessApi.EserviceVersion,
): API_CatalogEserviceSearchResult => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  latestVersionRequiredAttributes: eserviceVersion.requiredAttributes,
  latestVersionState: toAPI_EserviceVersionState(eserviceVersion.state),
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producerId: eservice.producerId,
});

export const toAPI_CatalogEserviceDetail = (
  eservice: eserviceProcessApi.Eservice,
  latestVersion: eserviceProcessApi.EserviceVersion,
  interfaceDocument: eserviceProcessApi.EserviceVersionInterfaceDocument,
): API_CatalogEserviceDetail => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  interfaceDocument: {
    checksum: interfaceDocument.checksum,
    name: interfaceDocument.name,
    prettyName: interfaceDocument.prettyName,
  },
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  latestVersion: {
    accessTokenAudience: latestVersion.accessTokenAudience,
    accessTokenDuration: latestVersion.accessTokenDuration,
    accessTokenType: toAPI_AccessTokenType(latestVersion.accessTokenType),
    maxDailyCallsPerConsumer: latestVersion.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: latestVersion.maxDailyCallsPerKnode,
    requiredAttributes: latestVersion.requiredAttributes,
    state: toAPI_EserviceVersionState(latestVersion.state),
  },
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producerId: eservice.producerId,
});
