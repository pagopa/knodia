import type { Agreement, AgreementState } from "@knodia/agreement-models";
import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { Organization } from "@knodia/organization-models";

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

const toK2KAccessTokenType = (
  tokenType: API_AccessTokenType,
): k2kGatewayApi.AccessTokenType =>
  match(tokenType)
    .with("Bearer", () => "BEARER" as const)
    .with("DPoP", () => "DPOP" as const)
    .exhaustive();

export const toK2KAgreement = (
  agreement: Agreement,
): k2kGatewayApi.Agreement => ({
  attributes: agreement.attributes,
  consumer: {
    id: agreement.consumer.id,
    knodeId: toK2KKnodeId(agreement.consumer.knodeId),
  },
  eserviceId: agreement.eserviceId,
  eserviceVersionId: agreement.eserviceVersionId,
  id: agreement.id,
  producerId: agreement.producerId,
  state: toK2KAgreementState(agreement.state),
  updatedAt: "",
});

export const toK2KAgreementState = (
  state: AgreementState,
): k2kGatewayApi.AgreementState =>
  match(state)
    .with("Active", () => "ACTIVE" as const)
    .with("Suspended", () => "SUSPENDED" as const)
    .with("Archived", () => "ARCHIVED" as const)
    .exhaustive();

export const toK2KKnodeId = (knodeId: API_KnodeId): k2kGatewayApi.KnodeId =>
  match(knodeId)
    .with("Orion", () => "ORION" as const)
    .with("Lynx", () => "LYNX" as const)
    .exhaustive();

export const toK2KEservice = (
  apiEserviceDetails: API_EserviceDetails,
): k2kGatewayApi.Eservice => ({
  categories: apiEserviceDetails.categories,
  description: apiEserviceDetails.description,
  id: apiEserviceDetails.id,
  isConsumerOperatorIdentificationRequired:
    apiEserviceDetails.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: apiEserviceDetails.isSignalHubEnabled,
  mode: toK2KMode(apiEserviceDetails.mode),
  name: apiEserviceDetails.name,
  producerId: apiEserviceDetails.producer.id,
  updatedAt: new Date().toISOString(),
});

export const toK2KEserviceVersion = (
  apiEserviceDetails: API_EserviceDetails,
): k2kGatewayApi.EserviceVersion => ({
  accessTokenAudience: apiEserviceDetails.latestVersion.accessTokenAudience,
  accessTokenDuration: apiEserviceDetails.latestVersion.accessTokenDuration,
  accessTokenType: toK2KAccessTokenType(
    apiEserviceDetails.latestVersion.accessTokenType,
  ),
  id: apiEserviceDetails.latestVersion.id,
  interfaceDocument: {
    checksum: apiEserviceDetails.interfaceDocument.checksum,
    contentType: "application/yaml",
    id: crypto.randomUUID(),
    name: apiEserviceDetails.interfaceDocument.name,
    prettyName: apiEserviceDetails.interfaceDocument.prettyName,
    updatedAt: new Date().toISOString(),
  },
  maxDailyCallsPerConsumer:
    apiEserviceDetails.latestVersion.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: apiEserviceDetails.latestVersion.maxDailyCallsPerKnode,
  requiredAttributes: apiEserviceDetails.latestVersion.requiredAttributes,
  state: toK2KVersionState(apiEserviceDetails.latestVersion.state),
  updatedAt: new Date().toISOString(),
  versionNumber: 1,
});

export const toK2KOrganization = (
  organization: Organization,
): k2kGatewayApi.Organization => ({
  attributes: organization.attributes,
  id: organization.id,
  name: organization.name,
});
