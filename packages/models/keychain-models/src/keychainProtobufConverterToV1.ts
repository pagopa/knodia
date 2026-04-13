import { match } from "ts-pattern";

import type {
  ConsumerKeychain,
  ConsumerKeychainKey,
  ConsumerKeychainUser,
  KeyAlgorithm,
  KeyFormat,
} from "./keychain.ts";

import {
  type ConsumerKeychainKeyV1,
  ConsumerKeychainUserV1,
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  KeyFormatV1,
} from "./generated/v1/keychain.ts";

const toKeyFormatV1 = (format: KeyFormat): KeyFormatV1 =>
  match(format)
    .with("PublicKey", () => KeyFormatV1.PublicKey)
    .with("X509Certificate", () => KeyFormatV1.X509Certificate)
    .exhaustive();

const toConsumerKeychainKeyV1 = (
  key: ConsumerKeychainKey,
): ConsumerKeychainKeyV1 => ({
  ...key,
  algorithm: toKeyAlgorithm(key.algorithm),
  createdAt: key.createdAt.getTime(),
  format: toKeyFormatV1(key.format),
});

const toConsumerKeychainUserV1 = (
  user: ConsumerKeychainUser,
): ConsumerKeychainUserV1 => ({
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
  keys: consumerKeychain.keys.map(toConsumerKeychainKeyV1),
  updatedAt: consumerKeychain.updatedAt.getTime(),
  users: consumerKeychain.users.map(toConsumerKeychainUserV1),
});
