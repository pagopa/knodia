import type { EserviceVersion } from "@knodia/eservice-models";

import { Eservice, getLatestVersion } from "@knodia/eservice-models";

import type { API_EserviceVersion } from "./api.ts";

import { API_Eservice } from "./api.ts";

export const toAPI_EserviceVersion = (
  version: EserviceVersion,
): API_EserviceVersion => ({
  accessTokenAudience: version.accessTokenAudience,
  accessTokenDuration: version.accessTokenDuration,
  accessTokenType: version.accessTokenType,
  createdAt: version.createdAt.toISOString(),
  id: version.id,
  interfaceDocument: {
    checksum: version.interfaceDocument.checksum,
    contentType: version.interfaceDocument.contentType,
    id: version.interfaceDocument.id,
    name: version.interfaceDocument.name,
    path: version.interfaceDocument.path,
    prettyName: version.interfaceDocument.prettyName,
  },
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
  state: getLatestVersion(eservice).state,
  updatedAt: eservice.updatedAt.toISOString(),
});
