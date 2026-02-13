import { Eservice, EserviceVersion } from "@knodia/eservice-models";

import { API_Eservice, API_EserviceVersion } from "./api.ts";

export const toAPI_EserviceVersion = (
  version: EserviceVersion,
): API_EserviceVersion => ({
  accessTokenAudience: version.accessTokenAudience,
  accessTokenDuration: version.accessTokenDuration,
  accessTokenType: version.accessTokenType,
  createdAt: version.createdAt.toISOString(),
  id: version.id,
  maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
  requiredAttributes: version.requiredAttributes,
  state: version.state,
  updatedAt: version.updatedAt.toISOString(),
  versionNumber: version.versionNumber,
});

export const toAPI_Eservice = (eservice: Eservice): API_Eservice => ({
  categories: eservice.categories,
  createdAt: eservice.createdAt.toISOString(),
  description: eservice.description,
  id: eservice.id,
  isConsumerOperatorIdentificationRequired:
    eservice.isConsumerOperatorIdentificationRequired,
  isSignalHubEnabled: eservice.isSignalHubEnabled,
  mode: eservice.mode,
  name: eservice.name,
  producerId: eservice.producerId,
  updatedAt: eservice.updatedAt.toISOString(),
});
