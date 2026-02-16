import type { eserviceProcessApi } from "@knodia/eservice-process-client";

import type {
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
  categories,
  counters,
  eservice,
  requiredAttributes,
  version,
}: {
  categories: eserviceProcessApi.EserviceCategory[];
  counters: {
    agreements: { active: number; total: number };
    purposes: { active: number; total: number };
  };
  eservice: eserviceProcessApi.Eservice;
  requiredAttributes: eserviceProcessApi.EserviceAttribute[][];
  version: eserviceProcessApi.EserviceVersion;
}): API_ProducerEserviceDetails => ({
  agreements: counters.agreements,
  categories: categories,
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
    accessTokenAudience: version.accessTokenAudience,
    accessTokenDuration: version.accessTokenDuration,
    accessTokenType: version.accessTokenType,
    createdAt: version.createdAt,
    id: version.id,
    maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
    maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
    requiredAttributes: requiredAttributes,
    state: version.state,
    updatedAt: version.updatedAt,
    versionNumber: version.versionNumber,
  },
});
