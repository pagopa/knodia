import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import { match } from "ts-pattern";

import type { API_EserviceDetails } from "../src/models/eservice/api.ts";

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

export const toK2KAPI_KnodeId = (knodeId: API_KnodeId): k2kGatewayApi.KnodeId =>
  match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();

export const toK2KEservice = (
  apiDetail: API_EserviceDetails,
): k2kGatewayApi.Eservice => ({
  categories: apiDetail.categories,
  description: apiDetail.description,
  id: apiDetail.id,
  isConsumerOperatorIdentificationRequired:
    apiDetail.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: apiDetail.isSignalHubEnabled,
  mode: toK2KMode(apiDetail.mode),
  name: apiDetail.name,
  producerId: apiDetail.producer.id,
  updatedAt: new Date().toISOString(),
});

export const toK2KEserviceVersion = (
  apiDetail: API_EserviceDetails,
): k2kGatewayApi.EserviceVersion => ({
  accessTokenAudience: apiDetail.latestVersion.accessTokenAudience,
  accessTokenDuration: apiDetail.latestVersion.accessTokenDuration,
  accessTokenType: toK2KAccessTokenType(
    apiDetail.latestVersion.accessTokenType,
  ),
  id: crypto.randomUUID(),
  interfaceDocument: {
    checksum: apiDetail.interfaceDocument.checksum,
    contentType: "application/yaml",
    id: crypto.randomUUID(),
    name: apiDetail.interfaceDocument.name,
    prettyName: apiDetail.interfaceDocument.prettyName,
    updatedAt: new Date().toISOString(),
  },
  maxDailyCallsPerConsumer: apiDetail.latestVersion.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: apiDetail.latestVersion.maxDailyCallsPerKnode,
  requiredAttributes: apiDetail.latestVersion.requiredAttributes,
  state: toK2KVersionState(apiDetail.latestVersion.state),
  updatedAt: new Date().toISOString(),
  versionNumber: 1,
});
