import type { IdmUser } from "@knodia/cognito-idm-client";
import type {
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
  FlatKnodeApiKeychain,
  KeychainKey,
} from "@knodia/keychain-models";

import type {
  API_ConsumerKeychainPurpose,
  API_Keychain,
  API_KeychainKey,
  API_User,
} from "./api.ts";

export const toAPI_Keychain = (
  keychain: FlatConsumerKeychain | FlatKnodeApiKeychain,
): API_Keychain => ({
  createdAt: keychain.createdAt.toISOString(),
  description: keychain.description,
  id: keychain.id,
  name: keychain.name,
  ownerId: keychain.ownerId,
  updatedAt: keychain.updatedAt.toISOString(),
});

export const toAPI_KeychainKey = (key: KeychainKey): API_KeychainKey => ({
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

export const toAPI_ConsumerKeychainPurpose = (
  consumerKeychainPurpose: ConsumerKeychainPurpose,
): API_ConsumerKeychainPurpose => ({
  ...consumerKeychainPurpose,
  linkedAt: consumerKeychainPurpose.linkedAt.toISOString(),
});
