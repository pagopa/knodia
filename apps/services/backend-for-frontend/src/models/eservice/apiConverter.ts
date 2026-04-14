import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import {
  type AttributeId,
  isAttributePossessed,
} from "@knodia/attribute-models";

import type {
  API_ConsumerCatalogEserviceSearchResult,
  API_ConsumerEservice,
  API_ConsumerEserviceDetails,
  API_ProducerEservice,
  API_ProducerEserviceDetails,
} from "./api.ts";

import { hasRecentlyBeenUpdated } from "../../utils/recentUpdate.ts";

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
  activeAgreements,
  activePurposes,
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
  consumerAttributes: readonly AttributeId[],
): API_ConsumerEserviceDetails => ({
  accessToken: {
    audience: detail.latestVersion.accessTokenAudience,
    duration: detail.latestVersion.accessTokenDuration,
    type: detail.latestVersion.accessTokenType,
  },
  agreement: detail.agreement,
  categories: detail.categories,
  description: detail.description,
  id: detail.id,
  identificationRequired: detail.isConsumerOperatorIdentificationRequired,
  interfaceDocument: {
    checksum: detail.interfaceDocument.checksum,
    name: detail.interfaceDocument.prettyName.en,
  },
  isSignalHubEnabled: detail.isSignalHubEnabled,
  latestVersionId: detail.latestVersion.id,
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
        possessed: isAttributePossessed(consumerAttributes, attr),
      })),
  ),
  state: detail.latestVersion.state,
});

export const toAPI_ConsumerEservice = (
  eservice: remoteResourcesManagerApi.Eservice,
  recentUpdateDays: number,
): API_ConsumerEservice => ({
  agreement: eservice.agreement,
  categories: eservice.categories,
  // TODO https://pagopa.atlassian.net/browse/KN-246
  hasRecentlyBeenUpdated: hasRecentlyBeenUpdated(eservice, recentUpdateDays),
  id: eservice.id,
  mode: eservice.mode,
  name: eservice.name,
  producer: eservice.producer,
  requiredAttributes: eservice.version.requiredAttributes,
  state: eservice.version.state,
});

export const toAPI_ConsumerCatalogEserviceSearchResult = (
  catalogEserviceSearchResult: remoteResourcesManagerApi.CatalogEserviceSearchResult,
  hasRequiredAttributes: boolean,
  knodeId: API_KnodeId,
): API_ConsumerCatalogEserviceSearchResult => ({
  categories: catalogEserviceSearchResult.categories,
  description: catalogEserviceSearchResult.description,
  hasRequiredAttributes,
  id: catalogEserviceSearchResult.id,
  latestVersionState: catalogEserviceSearchResult.latestVersionState,
  mode: catalogEserviceSearchResult.mode,
  name: catalogEserviceSearchResult.name,
  producer: {
    id: catalogEserviceSearchResult.producer.id,
    knodeId,
    name: catalogEserviceSearchResult.producer.name,
  },
});
