import type { eserviceProcessApi } from "@knodia/eservice-process-client";
import type { keychainProcessApi } from "@knodia/keychain-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type {
  API_ConsumerKeychainOption,
  API_ConsumerKeychainPurpose,
  API_Keychain,
  API_KeychainDetails,
  API_KeychainKey,
  API_ProducerKeychainEservice,
  API_User,
} from "./api.ts";

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
  counters: {
    eservicesCount?: number;
    keysCount: number;
    membersCount: number;
    purposesCount?: number;
  },
): API_Keychain => ({
  id: keychain.id,
  keysCount: counters.keysCount,
  membersCount: counters.membersCount,
  name: keychain.name,
  ...(counters.purposesCount !== undefined && {
    purposesCount: counters.purposesCount,
  }),
  ...(counters.eservicesCount !== undefined && {
    eservicesCount: counters.eservicesCount,
  }),
});

export const toAPI_KeychainOption = (
  keychain: keychainProcessApi.Keychain,
): API_ConsumerKeychainOption => ({
  id: keychain.id,
  name: keychain.name,
});

export const toAPI_ConsumerKeychainPurpose = (
  eservice: remoteResourcesManagerApi.EserviceDetails,
  purpose: remoteResourcesManagerApi.Purpose,
): API_ConsumerKeychainPurpose => ({
  eservice: {
    id: eservice.id,
    name: eservice.name,
  },
  id: purpose.id,
  knodeId: eservice.knodeId,
  name: purpose.name,
  producer: {
    id: eservice.producer.id,
    name: eservice.producer.name,
  },
  state: purpose.state,
});

export const toAPI_ProducerKeychainEservice = (
  link: keychainProcessApi.ProducerKeychainEservice,
  eservice: eserviceProcessApi.Eservice,
  state: eserviceProcessApi.EserviceVersionState,
): API_ProducerKeychainEservice => ({
  categories: eservice.categories,
  id: eservice.id,
  linkedAt: link.linkedAt,
  mode: eservice.mode,
  name: eservice.name,
  state,
});

export const toAPI_KeychainKey = (
  key: keychainProcessApi.KeychainKey,
  operators: organizationProcessApi.Operators,
): API_KeychainKey => {
  const owner = operators.find((operator) => operator.id === key.userId);

  return {
    createdAt: key.createdAt,
    kid: key.kid,
    name: key.name,
    uploaderUsername: owner?.username,
  };
};

export const toAPI_User = (user: keychainProcessApi.User): API_User => ({
  email: user.email,
  id: user.id,
  username: user.username,
});
