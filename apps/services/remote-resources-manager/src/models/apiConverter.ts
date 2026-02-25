import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import {
  API_AccessTokenType,
  API_EserviceMode,
  API_EserviceVersionState,
} from "@knodia/eservice-models/api";
import { match } from "ts-pattern";

import type {
  API_CatalogEserviceDetail,
  API_CatalogEserviceSearchResult,
} from "./api.ts";

export const toAPI_CatalogEserviceSearchResult = (
  catalogEservice: k2kGatewayApi.CatalogEserviceSearchResult,
): API_CatalogEserviceSearchResult => ({
  ...catalogEservice,
  latestVersionState: toAPI_EserviceVersionState(
    catalogEservice.latestVersionState,
  ),
  mode: toAPI_EserviceMode(catalogEservice.mode),
});

export const toAPI_CatalogEserviceDetail = (
  detail: k2kGatewayApi.CatalogEserviceDetail,
): API_CatalogEserviceDetail => ({
  ...detail,
  interfaceDocument: {
    ...detail.interfaceDocument,
  },
  latestVersion: {
    ...detail.latestVersion,
    accessTokenType: toAPI_AccessTokenType(
      detail.latestVersion.accessTokenType,
    ),
    state: toAPI_EserviceVersionState(detail.latestVersion.state),
  },
  mode: toAPI_EserviceMode(detail.mode),
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
