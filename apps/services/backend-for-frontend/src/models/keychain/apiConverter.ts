import type { keychainProcessApi } from "@knodia/keychain-process-client";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import type {
  API_ConsumerKeychainOption,
  API_ConsumerKeychainPurpose,
  API_Keychain,
  API_KeychainDetails,
  API_KeychainKey,
  API_OrganizationUser,
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
  counters: { keysCount: number; membersCount: number },
): API_Keychain => ({
  id: keychain.id,
  keysCount: counters.keysCount,
  membersCount: counters.membersCount,
  name: keychain.name,
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
  name: purpose.name,
  producer: {
    id: eservice.producer.id,
    knodeId: eservice.producer.knodeId,
    name: eservice.producer.name,
  },
  state: purpose.state,
});

export const toAPI_KeychainKey = (
  key: keychainProcessApi.KeychainKey,
  users: keychainProcessApi.OrganizationUsers,
): API_KeychainKey => {
  const owner = users.find((user) => user.id === key.userId);

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

export const toAPI_OrganizationUser = (
  user: keychainProcessApi.OrganizationUser,
): API_OrganizationUser => ({
  ...toAPI_User(user),
  role: user.role,
});
