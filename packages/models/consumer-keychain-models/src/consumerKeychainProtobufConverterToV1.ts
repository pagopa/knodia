import { match } from "ts-pattern";

import type {
  ConsumerKeychain,
  ConsumerKeychainKey,
  KeyFormat,
  KeyUse,
} from "./consumerKeychain.ts";

import {
  type ConsumerKeychainKeyV1,
  type ConsumerKeychainV1,
  KeyFormatV1,
  KeyUseV1,
} from "./generated/v1/consumerKeychain.ts";

const toKeyFormatV1 = (format: KeyFormat): KeyFormatV1 =>
  match(format)
    .with("jwk", () => KeyFormatV1.JWK)
    .with("x509", () => KeyFormatV1.X509)
    .exhaustive();

const toKeyUseV1 = (use: KeyUse): KeyUseV1 =>
  match(use)
    .with("sig", () => KeyUseV1.SIG)
    .with("enc", () => KeyUseV1.ENC)
    .exhaustive();

const toConsumerKeychainKeyV1 = (
  key: ConsumerKeychainKey,
): ConsumerKeychainKeyV1 => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt.getTime(),
  encodedPem: key.encodedPem,
  format: toKeyFormatV1(key.format),
  kid: key.kid,
  name: key.name,
  use: toKeyUseV1(key.use),
  userId: key.userId,
});

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
