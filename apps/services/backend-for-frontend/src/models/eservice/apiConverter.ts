import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { keychainProcessApi } from "@knodia/keychain-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type {
  API_ConsumerCatalogEserviceSearchResult,
  API_ConsumerEserviceDetails,
  API_Keychain,
  API_KeychainDetails,
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

export const toAPI_ConsumerEserviceDetails = (
  detail: remoteResourcesManagerApi.EserviceDetails,
): API_ConsumerEserviceDetails => ({
  accessToken: {
    audience: detail.latestVersion.accessTokenAudience,
    duration: detail.latestVersion.accessTokenDuration,
    type: detail.latestVersion.accessTokenType,
  },
  categories: detail.categories,
  description: detail.description,
  id: detail.id,
  identificationRequired: detail.isConsumerOperatorIdentificationRequired,
  interfaceDocument: {
    checksum: detail.interfaceDocument.checksum,
    name: detail.interfaceDocument.prettyName.en,
  },
  isSignalHubEnabled: detail.isSignalHubEnabled,
  maxDailyCalls: {
    perConsumer: detail.latestVersion.maxDailyCallsPerConsumer,
    perKnode: detail.latestVersion.maxDailyCallsPerKnode,
  },
  mode: detail.mode,
  name: detail.name,
  producer: detail.producer,
  requiredAttributes: detail.latestVersion.requiredAttributes.map(
    (group: remoteResourcesManagerApi.Attribute[]) =>
      group.map((attr: remoteResourcesManagerApi.Attribute) => ({
        ...attr,
        possessed: Math.random() >= 0.5, // TODO: check actual attribute possession
      })),
  ),
  state: detail.latestVersion.state,
});

export const toAPI_ConsumerCatalogEserviceSearchResult = (
  catalogEserviceSearchResult: remoteResourcesManagerApi.CatalogEserviceSearchResult,
  hasRequiredAttributes: boolean,
  producerName: string,
): API_ConsumerCatalogEserviceSearchResult => ({
  categories: catalogEserviceSearchResult.categories,
  description: catalogEserviceSearchResult.description,
  hasRequiredAttributes,
  id: catalogEserviceSearchResult.id,
  latestVersionState: catalogEserviceSearchResult.latestVersionState,
  mode: catalogEserviceSearchResult.mode,
  name: catalogEserviceSearchResult.name,
  producer: {
    id: catalogEserviceSearchResult.producerId,
    name: producerName,
  },
});

export const toAPI_KeychainDetails = (
  keychain: keychainProcessApi.Keychain,
): API_KeychainDetails => ({
  createdAt: keychain.createdAt,
  description: keychain.description,
  id: keychain.id,
  name: keychain.name,
  updatedAt: keychain.updatedAt,
});

export const toAPI_Keychain = (
  keychain: keychainProcessApi.Keychain,
  counters: { keysCount: number; membersCount: number },
): API_Keychain => ({
  id: keychain.id,
  keysCount: counters.keysCount,
  membersCount: counters.membersCount,
  name: keychain.name,
});
