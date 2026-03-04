import { eserviceProcessApi } from "@knodia/eservice-process-client";
import { match } from "ts-pattern";

import type {
  API_AccessTokenType,
  API_CatalogEserviceSearchResult,
  API_Eservice,
  API_EserviceMode,
  API_EserviceVersion,
  API_EserviceVersionInterfaceDocument,
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

export const toAPI_Eservice = (
  eservice: eserviceProcessApi.Eservice,
): API_Eservice => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producerId: eservice.producerId,
  updatedAt: eservice.updatedAt,
});

export const toAPI_EserviceVersion = (
  version: eserviceProcessApi.EserviceVersion,
): API_EserviceVersion => ({
  accessTokenAudience: version.accessTokenAudience,
  accessTokenDuration: version.accessTokenDuration,
  accessTokenType: toAPI_AccessTokenType(version.accessTokenType),
  id: version.id,
  maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
  requiredAttributes: version.requiredAttributes,
  state: toAPI_EserviceVersionState(version.state),
  updatedAt: version.updatedAt,
  versionNumber: version.versionNumber,
});

export const toAPI_EserviceVersionInterfaceDocument = (
  doc: eserviceProcessApi.EserviceVersionInterfaceDocument,
): API_EserviceVersionInterfaceDocument => ({
  checksum: doc.checksum,
  contentType: doc.contentType,
  id: doc.id,
  name: doc.name,
  path: doc.path,
  prettyName: doc.prettyName,
  updatedAt: doc.updatedAt,
});
