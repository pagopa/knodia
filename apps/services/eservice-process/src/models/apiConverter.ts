import { Eservice, EserviceVersion } from "@knodia/eservice-models";
import {
  toAPI_AccessTokenType,
  toAPI_EserviceMode,
  toAPI_EserviceVersionState,
} from "@knodia/eservice-models/apiConverters";

import { getLatestVersion } from "../utils/eserviceUtils.ts";
import { API_Eservice, API_EserviceVersion } from "./api.ts";

export const toAPI_EserviceVersion = (
  version: EserviceVersion,
): API_EserviceVersion => ({
  accessTokenAudience: version.accessTokenAudience,
  accessTokenDuration: version.accessTokenDuration,
  accessTokenType: toAPI_AccessTokenType(version.accessTokenType),
  createdAt: version.createdAt.toISOString(),
  id: version.id,
  maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
  requiredAttributes: version.requiredAttributes,
  state: toAPI_EserviceVersionState(version.state),
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
  mode: toAPI_EserviceMode(eservice.mode),
  name: eservice.name,
  producerId: eservice.producerId,
  state: toAPI_EserviceVersionState(getLatestVersion(eservice).state),
  updatedAt: eservice.updatedAt.toISOString(),
});
