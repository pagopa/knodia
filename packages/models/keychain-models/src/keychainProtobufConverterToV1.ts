import { match } from "ts-pattern";

import type {
  ConsumerKeychain,
  KeyAlgorithm,
  KeychainKey,
  KeychainUser,
  KeyFormat,
  KnodeApiKeychain,
} from "./keychain.ts";

import {
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  type KeychainKeyV1,
  type KeychainUserV1,
  KeyFormatV1,
  type KnodeApiKeychainV1,
} from "./generated/v1/keychain.ts";

const toKeyFormatV1 = (format: KeyFormat): KeyFormatV1 =>
  match(format)
    .with("PublicKey", () => KeyFormatV1.PublicKey)
    .with("X509Certificate", () => KeyFormatV1.X509Certificate)
    .exhaustive();

const toKeychainKeyV1 = (key: KeychainKey): KeychainKeyV1 => ({
  ...key,
  algorithm: toKeyAlgorithm(key.algorithm),
  createdAt: key.createdAt.getTime(),
  format: toKeyFormatV1(key.format),
});

const toKeychainUserV1 = (user: KeychainUser): KeychainUserV1 => ({
  ...user,
  addedAt: user.addedAt.getTime(),
});

const toKeyAlgorithm = (algorithm: KeyAlgorithm): KeyAlgorithmV1 =>
  match(algorithm)
    .with("RS256", () => KeyAlgorithmV1.RS256)
    .exhaustive();

export const toConsumerKeychainV1 = (
  consumerKeychain: ConsumerKeychain,
): ConsumerKeychainV1 => ({
  ...consumerKeychain,
  createdAt: consumerKeychain.createdAt.getTime(),
  keys: consumerKeychain.keys.map(toKeychainKeyV1),
  updatedAt: consumerKeychain.updatedAt.getTime(),
  users: consumerKeychain.users.map(toKeychainUserV1),
});

export const toKnodeApiKeychainV1 = (
  knodeApiKeychain: KnodeApiKeychain,
): KnodeApiKeychainV1 => ({
  ...knodeApiKeychain,
  createdAt: knodeApiKeychain.createdAt.getTime(),
  keys: knodeApiKeychain.keys.map(toKeychainKeyV1),
  updatedAt: knodeApiKeychain.updatedAt.getTime(),
  users: knodeApiKeychain.users.map(toKeychainUserV1),
});
