import type {
  ConsumerKeychainKey,
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";

import type { IdmUser, OrganizationUser } from "../services/userService.ts";
import type {
  API_ConsumerKeychainPurpose,
  API_Keychain,
  API_KeychainKey,
  API_OrganizationUser,
  API_User,
} from "./api.ts";

export const toAPI_Keychain = (
  keychain: FlatConsumerKeychain,
): API_Keychain => ({
  createdAt: keychain.createdAt.toISOString(),
  description: keychain.description,
  id: keychain.id,
  name: keychain.name,
  ownerId: keychain.ownerId,
  updatedAt: keychain.updatedAt.toISOString(),
});

export const toAPI_KeychainKey = (
  key: ConsumerKeychainKey,
): API_KeychainKey => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt.toISOString(),
  encodedPem: key.encodedPem,
  format: key.format,
  kid: key.kid,
  name: key.name,
  userId: key.userId,
});

export const toAPI_User = (idmUser: IdmUser): API_User => ({
  email: idmUser.email,
  id: idmUser.id,
  username: idmUser.username,
});

export const toAPI_OrganizationUser = (
  user: OrganizationUser,
): API_OrganizationUser => ({
  ...toAPI_User(user),
  role: user.role,
});

export const toAPI_ConsumerKeychainPurpose = (
  consumerKeychainPurpose: ConsumerKeychainPurpose,
): API_ConsumerKeychainPurpose => ({
  ...consumerKeychainPurpose,
  linkedAt: consumerKeychainPurpose.linkedAt.toISOString(),
});
