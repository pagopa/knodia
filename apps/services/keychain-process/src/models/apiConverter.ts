import type { IdmUser } from "@knodia/cognito-idm-client";
import type { UserId } from "@knodia/common-models/ids";
import type {
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
  FlatKnodeApiKeychain,
  FlatProducerKeychain,
  KeychainKey,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";
import type {
  API_CreatedMemberResource,
  API_PublicKey,
} from "@knodia/keychain-models/api";

import type {
  API_ConsumerKeychainPurpose,
  API_Keychain,
  API_KeychainKey,
  API_ProducerKeychainEservice,
  API_User,
} from "./api.ts";

export const toAPI_Keychain = (
  keychain: FlatConsumerKeychain | FlatKnodeApiKeychain | FlatProducerKeychain,
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

export const toAPI_CreatedMemberResource = (
  userId: UserId,
): API_CreatedMemberResource => ({
  userId,
});

export const toAPI_ProducerKeychainEservice = (
  producerKeychainEservice: ProducerKeychainEservice,
): API_ProducerKeychainEservice => ({
  ...producerKeychainEservice,
  linkedAt: producerKeychainEservice.linkedAt.toISOString(),
});

export const toAPI_PublicKey = (key: KeychainKey): API_PublicKey => ({
  algorithm: key.algorithm,
  encodedPem: key.encodedPem,
  format: key.format,
  kid: key.kid,
});
