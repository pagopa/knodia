import {
  type Eservice,
  type EserviceInterface,
  type EserviceVersion,
  type FlatEservice,
  type PurposeFormOption,
} from "@knodia/eservice-models";

import {
  type API_Eservice,
  type API_EserviceVersion,
  type API_EserviceVersionInterfaceDocument,
  type API_FlatEservice,
  type API_PurposeFormOption,
} from "./api.ts";

export const toAPI_EserviceVersion = (
  version: Omit<EserviceVersion, "interfaceDocument">,
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

export const toAPI_FlatEservice = (
  eservice: FlatEservice,
): API_FlatEservice => ({
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
  template: eservice.template,
  updatedAt: eservice.updatedAt.toISOString(),
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
  ...(eservice.receiveDataConfig !== undefined
    ? {
        receiveDataConfig: {
          purposeFormOptions: eservice.receiveDataConfig.purposeFormOptions.map(
            toAPI_PurposeFormOption,
          ),
        },
      }
    : {}),
  template: eservice.template,
  updatedAt: eservice.updatedAt.toISOString(),
  versions: eservice.versions.map(toAPI_EserviceVersion),
});

export const toAPI_EserviceVersionInterfaceDocument = (
  doc: EserviceInterface,
): API_EserviceVersionInterfaceDocument => ({
  checksum: doc.checksum,
  contentType: doc.contentType,
  createdAt: doc.createdAt.toISOString(),
  id: doc.id,
  name: doc.name,
  path: doc.path,
  prettyName: doc.prettyName,
  updatedAt: doc.updatedAt.toISOString(),
});

export const toAPI_PurposeFormOption = (
  option: PurposeFormOption,
): API_PurposeFormOption => ({
  description: option.description,
  formAnswersJson: option.formAnswersJson,
  formSchemaVersion: option.formSchemaVersion,
  id: option.id,
  name: option.name,
});
