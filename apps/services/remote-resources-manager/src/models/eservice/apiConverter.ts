import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { match } from "ts-pattern";

import type {
  API_AgreementDetail,
  API_CatalogEserviceSearchResult,
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

export const toAPI_AgreementDetail = (
  agreement?: k2kGatewayApi.Agreement,
): API_AgreementDetail | undefined =>
  agreement
    ? { id: agreement.id, state: toAPI_AgreementState(agreement.state) }
    : agreement;

export const toAPI_EserviceDetails = (
  eservice: k2kGatewayApi.Eservice,
  version: k2kGatewayApi.EserviceVersion,
  producer: k2kGatewayApi.Organization,
  agreement?: k2kGatewayApi.Agreement,
): API_EserviceDetails => ({
  agreement: toAPI_AgreementDetail(agreement),
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
    knodeName: "Knode", // TODO: retrieve real data from producer knode
    name: producer.name,
    notes: "Notes", // TODO: retrieve real data from producer knode
  },
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
