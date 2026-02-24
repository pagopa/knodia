import type { API_LocalizedName } from "@knodia/eservice-models/api";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type {
  API_CatalogEserviceSearchResult,
  API_ProducerEservice,
  API_ProducerEserviceDetails,
} from "./api.ts";

export const toAPI_ProducerEservice = ({
  activeAgreements,
  activePurposes,
  eservice,
  state,
}: {
  activeAgreements: number;
  activePurposes: number;
  eservice: eserviceProcessApi.Eservice;
  state: eserviceProcessApi.EserviceVersionState;
}): API_ProducerEservice => ({
  activeAgreements: activeAgreements,
  activePurposes: activePurposes,
  categories: eservice.categories,
  id: eservice.id,
  mode: eservice.mode,
  name: eservice.name,
  state,
});

export const toAPI_ProducerEserviceDetails = ({
  counters,
  eservice,
  latestVersion,
  latestVersionInterface,
}: {
  counters: {
    agreements: { active: number; total: number };
    purposes: { active: number; total: number; totalApiCallsPerDay: number };
  };
  eservice: eserviceProcessApi.Eservice;
  latestVersion: eserviceProcessApi.EserviceVersion;
  latestVersionInterface: eserviceProcessApi.EserviceVersionInterfaceDocument;
}): API_ProducerEserviceDetails => ({
  agreements: counters.agreements,
  categories: eservice.categories,
  createdAt: eservice.createdAt,
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: eservice.mode,
  name: eservice.name,
  producerId: eservice.producerId,
  purposes: counters.purposes,
  updatedAt: eservice.updatedAt,
  version: {
    accessTokenAudience: latestVersion.accessTokenAudience,
    accessTokenDuration: latestVersion.accessTokenDuration,
    accessTokenType: latestVersion.accessTokenType,
    createdAt: latestVersion.createdAt,
    id: latestVersion.id,
    interfaceDocument: {
      checksum: latestVersionInterface.checksum,
      prettyName: latestVersionInterface.prettyName,
    },
    maxDailyCallsPerConsumer: latestVersion.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: latestVersion.maxDailyCallsPerKnode,
    requiredAttributes: latestVersion.requiredAttributes,
    state: latestVersion.state,
    updatedAt: latestVersion.updatedAt,
    versionNumber: latestVersion.versionNumber,
  },
});

export const toAPI_CatalogEserviceSearchResult = (
  catalogEserviceSearchResult: remoteResourcesManagerApi.CatalogEserviceSearchResult,
  producerName: API_LocalizedName, // TODO: update with producer process API_LocalizedName
): API_CatalogEserviceSearchResult => ({
  categories: catalogEserviceSearchResult.categories,
  description: catalogEserviceSearchResult.description,
  id: catalogEserviceSearchResult.id,
  latestVersionRequiredAttributes:
    catalogEserviceSearchResult.latestVersionRequiredAttributes,
  latestVersionState: catalogEserviceSearchResult.latestVersionState,
  mode: catalogEserviceSearchResult.mode,
  name: catalogEserviceSearchResult.name,
  producer: {
    id: catalogEserviceSearchResult.producerId,
    name: producerName,
  },
});
