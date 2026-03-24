import { match } from "ts-pattern";

import type {
  ConsumerKeychain,
  ConsumerKeychainKey,
  KeyAlgorithm,
  KeyFormat,
} from "./keychain.ts";

import {
  type ConsumerKeychainKeyV1,
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  KeyFormatV1,
} from "./generated/v1/keychain.ts";

const toKeyFormatV1 = (format: KeyFormat): KeyFormatV1 =>
  match(format)
    .with("jwk", () => KeyFormatV1.JWK)
    .with("x509", () => KeyFormatV1.X509)
    .exhaustive();

/** @knipignore -  Will be used when implementing the keychain keys lifecycle */
const toConsumerKeychainKeyV1 = (
  key: ConsumerKeychainKey,
): ConsumerKeychainKeyV1 => ({
  ...key,
  algorithm: toKeyAlgorithm(key.algorithm),
  createdAt: key.createdAt.getTime(),
  format: toKeyFormatV1(key.format),
});

/** @knipignore -  Will be used when implementing the keychain keys lifecycle */
export const toKeyAlgorithm = (algorithm: KeyAlgorithm): KeyAlgorithmV1 =>
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
});
