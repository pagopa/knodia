import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { match } from "ts-pattern";

import type {
  API_CatalogEserviceSearchResult,
  API_Eservice,
  API_EserviceAgreementDetail,
  API_EserviceDetails,
} from "./api.ts";

import { toAPI_AgreementState } from "../agreement/apiConverter.ts";

export const toAPI_CatalogEserviceSearchResult = (
  catalogEservice: k2kGatewayApi.CatalogEserviceSearchResult,
  producerName: string,
): API_CatalogEserviceSearchResult => ({
  categories: catalogEservice.categories,
  description: catalogEservice.description,
  id: catalogEservice.id,
  latestVersionRequiredAttributes:
    catalogEservice.latestVersionRequiredAttributes,
  latestVersionState: toAPI_EserviceVersionState(
    catalogEservice.latestVersionState,
  ),
  mode: toAPI_EserviceMode(catalogEservice.mode),
  name: catalogEservice.name,
  producer: {
    id: catalogEservice.producerId,
    name: producerName,
  },
  updatedAt: catalogEservice.updatedAt,
});

const toAPI_EserviceAgreementDetail = (
  agreement?: k2kGatewayApi.Agreement,
): API_EserviceAgreementDetail | undefined =>
  agreement
    ? {
        id: agreement.id,
        state: toAPI_AgreementState(agreement.state),
        suspendedByConsumerAt: agreement.suspendedByConsumerAt ?? null,
        suspendedByProducerAt: agreement.suspendedByProducerAt ?? null,
        updatedAt: agreement.updatedAt,
      }
    : undefined;

export const toAPI_EserviceDetails = (
  eservice: k2kGatewayApi.Eservice,
  version: k2kGatewayApi.EserviceVersion,
  producer: k2kGatewayApi.Organization & { knodeId: API_KnodeId },
  agreement?: k2kGatewayApi.Agreement,
): API_EserviceDetails => ({
  agreement: toAPI_EserviceAgreementDetail(agreement),
  categories: eservice.categories,
  description: eservice.description,
  id: eservice.id,
  interfaceDocument: {
    checksum: version.interfaceDocument.checksum,
    name: version.interfaceDocument.name,
    prettyName: version.interfaceDocument.prettyName,
  },
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  latestVersion: {
    accessTokenAudience: version.accessTokenAudience,
    accessTokenDuration: version.accessTokenDuration,
    accessTokenType: toAPI_AccessTokenType(version.accessTokenType),
    id: version.id,
    maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
    requiredAttributes: version.requiredAttributes,
    state: toAPI_EserviceVersionState(version.state),
  },
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producer: {
    email: "info@example.com", // TODO: retrieve real data from producer knode
    id: producer.id,
    knodeId: producer.knodeId,
    name: producer.name,
    notes: "Notes", // TODO: retrieve real data from producer knode
  },
  updatedAt: eservice.updatedAt,
});

const toAPI_AccessTokenType = (
  accessTokenType: k2kGatewayApi.AccessTokenType,
): API_AccessTokenType =>
  match(accessTokenType)
    .with("BEARER", () => API_AccessTokenType.enum.Bearer)
    .with("DPOP", () => API_AccessTokenType.enum.DPoP)
    .exhaustive();

const toAPI_EserviceVersionState = (
  versionState: k2kGatewayApi.EserviceVersionState,
): API_EserviceVersionState =>
  match(versionState)
    .with("ACTIVE", () => API_EserviceVersionState.enum.Active)
    .with("SUSPENDED", () => API_EserviceVersionState.enum.Suspended)
    .with("ARCHIVED", () => API_EserviceVersionState.enum.Archived)
    .exhaustive();

const toAPI_EserviceMode = (
  mode: k2kGatewayApi.EserviceMode,
): API_EserviceMode =>
  match(mode)
    .with("PROVIDE_DATA", () => API_EserviceMode.enum.ProvideData)
    .with("RECEIVE_DATA", () => API_EserviceMode.enum.ReceiveData)
    .exhaustive();

export const toAPI_Eservice = ({
  agreement,
  eservice,
  eserviceVersion,
  producer,
}: {
  agreement: k2kGatewayApi.Agreement;
  eservice: k2kGatewayApi.Eservice;
  eserviceVersion: k2kGatewayApi.EserviceVersion;
  producer: k2kGatewayApi.Organization & { knodeId: API_KnodeId };
}): API_Eservice => ({
  agreement: {
    id: agreement.id,
    state: toAPI_AgreementState(agreement.state),
    updatedAt: agreement.updatedAt,
  },
  categories: eservice.categories,
  id: eservice.id,
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producer: {
    id: producer.id,
    knodeId: producer.knodeId,
    name: producer.name,
  },
  updatedAt: eservice.updatedAt,
  version: {
    id: eserviceVersion.id,
    requiredAttributes: eserviceVersion.requiredAttributes,
    state: toAPI_EserviceVersionState(eserviceVersion.state),
  },
});
