import { match } from "ts-pattern";

import type {
  ConsumerKeychain,
  ConsumerKeychainKey,
  KeyAlgorithm,
  KeyFormat,
} from "./consumerKeychain.ts";

import {
  type ConsumerKeychainKeyV1,
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  KeyFormatV1,
} from "./generated/v1/consumerKeychain.ts";

const toKeyFormatV1 = (format: KeyFormat): KeyFormatV1 =>
  match(format)
    .with("jwk", () => KeyFormatV1.JWK)
    .with("x509", () => KeyFormatV1.X509)
    .exhaustive();

const toConsumerKeychainKeyV1 = (
  key: ConsumerKeychainKey,
): ConsumerKeychainKeyV1 => ({
  algorithm: toKeyAlgorithm(key.algorithm),
  createdAt: key.createdAt.getTime(),
  encodedPem: key.encodedPem,
  format: toKeyFormatV1(key.format),
  kid: key.kid,
  name: key.name,
  userId: key.userId,
});

export const toKeyAlgorithm = (algorithm: KeyAlgorithm): KeyAlgorithmV1 =>
  match(algorithm)
    .with("RS256", () => KeyAlgorithmV1.RS256)
    .exhaustive();

export const toConsumerKeychainV1 = (
  consumerKeychain: ConsumerKeychain,
): ConsumerKeychainV1 => ({
  createdAt: consumerKeychain.createdAt.getTime(),
  description: consumerKeychain.description,
  id: consumerKeychain.id,
  keys: consumerKeychain.keys.map(toConsumerKeychainKeyV1),
  name: consumerKeychain.name,
  ownerId: consumerKeychain.ownerId,
  purposes: consumerKeychain.purposes,
  updatedAt: consumerKeychain.updatedAt.getTime(),
  users: consumerKeychain.users,
});
