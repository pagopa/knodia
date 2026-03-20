import type { Agreement, AgreementState } from "@knodia/agreement-models";
import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { Eservice, EserviceVersion } from "@knodia/eservice-models";
import type {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { Organization } from "@knodia/organization-models";

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
  updatedAt: agreement.updatedAt.toISOString(),
});

const toK2KAgreementState = (
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

export const toK2KEservice = (eservice: Eservice): k2kGatewayApi.Eservice => ({
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: toK2KMode(eservice.mode),
  name: eservice.name,
  producerId: eservice.producerId,
  updatedAt: eservice.updatedAt.toISOString(),
});

export const toK2KEserviceVersion = (
  eserviceVersion: EserviceVersion,
): k2kGatewayApi.EserviceVersion => ({
  accessTokenAudience: eserviceVersion.accessTokenAudience,
  accessTokenDuration: eserviceVersion.accessTokenDuration,
  accessTokenType: toK2KAccessTokenType(eserviceVersion.accessTokenType),
  id: eserviceVersion.id,
  interfaceDocument: {
    checksum: eserviceVersion.interfaceDocument.checksum,
    contentType: eserviceVersion.interfaceDocument.contentType,
    id: eserviceVersion.interfaceDocument.id,
    name: eserviceVersion.interfaceDocument.name,
    prettyName: eserviceVersion.interfaceDocument.prettyName,
    updatedAt: eserviceVersion.interfaceDocument.updatedAt.toISOString(),
  },
  maxDailyCallsPerConsumer: eserviceVersion.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: eserviceVersion.maxDailyCallsPerKnode,
  requiredAttributes: eserviceVersion.requiredAttributes,
  state: toK2KVersionState(eserviceVersion.state),
  updatedAt: eserviceVersion.updatedAt.toISOString(),
  versionNumber: eserviceVersion.versionNumber,
});

export const toK2KOrganization = (
  organization: Organization,
): k2kGatewayApi.Organization => ({
  attributes: organization.attributes,
  id: organization.id,
  name: organization.name,
});

export const toK2KOrganization = (
  organization: Organization,
): k2kGatewayApi.Organization => ({
  attributes: organization.attributes,
  id: organization.id,
  name: organization.name,
});
