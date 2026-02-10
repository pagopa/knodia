import type { API_ProducerEservice } from "@knodia/eservice-models/api";
import type { eserviceProcessApi } from "@knodia/eservice-process-client";

import type { API_EserviceDetails } from "./api.ts";

export const toAPI_ProducerEservice = (
  eservice: eserviceProcessApi.Eservice,
  activeAgreements: number,
  activePurposes: number,
): API_ProducerEservice => ({
  activeAgreements: activeAgreements,
  activePurposes: activePurposes,
  categories: eservice.categories,
  id: eservice.id,
  mode: eservice.mode,
  name: eservice.name,
  status: eservice.status,
});

export const toAPI_EserviceDetails = (
  eservice: eserviceProcessApi.Eservice,
  version: eserviceProcessApi.EserviceVersion,
  counters: {
    agreements: { active: number; total: number };
    purposes: { active: number; total: number };
  },
): API_EserviceDetails => ({
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
  status: eservice.status,
  updatedAt: eservice.updatedAt,
  version: {
    accessTokenAudience: version.accessTokenAudience,
    accessTokenDuration: version.accessTokenDuration,
    accessTokenType: version.accessTokenType,
    createdAt: version.createdAt,
    id: version.id,
    interfaceDocument: version.interfaceDocument,
    maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
    requiredAttributes: version.requiredAttributes,
    state: version.state,
    updatedAt: version.updatedAt,
    versionNumber: version.versionNumber,
  },
});
