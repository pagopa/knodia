import type { Eservice, EserviceVersion } from "@knodia/eservice-models";
import type { API_EserviceVersion } from "@knodia/eservice-models/api";

import type { API_Eservice, API_EserviceDetails } from "./api.ts";

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

const toAPI_EserviceVersion = (
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
    createdAt: version.interfaceDocument.createdAt.toISOString(),
    id: version.interfaceDocument.id,
    name: version.interfaceDocument.name,
    path: version.interfaceDocument.path,
    prettyName: version.interfaceDocument.prettyName,
    updatedAt: version.interfaceDocument.updatedAt.toISOString(),
  },
  maxDailyCallsPerConsumer: version.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: version.maxDailyCallsPerKnode,
  requiredAttributes: version.requiredAttributes,
  state: version.state,
  updatedAt: version.updatedAt.toISOString(),
  versionNumber: version.versionNumber,
});

export const toAPI_EserviceDetails = (
  eservice: Eservice,
): API_EserviceDetails => ({
  ...toAPI_Eservice(eservice),
  versions: eservice.versions.map(toAPI_EserviceVersion),
});
