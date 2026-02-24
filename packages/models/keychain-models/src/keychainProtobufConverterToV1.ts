import { match } from "ts-pattern";

import type {
  Keychain,
  KeychainKey,
  KeychainKind,
  KeyFormat,
  KeyUse,
} from "./keychain.ts";

import {
  type KeychainKeyV1,
  KeychainKindV1,
  type KeychainV1,
  KeyFormatV1,
  KeyUseV1,
} from "./generated/v1/keychain.ts";

const toKeychainKindV1 = (kind: KeychainKind): KeychainKindV1 =>
  match(kind)
    .with("Producer", () => KeychainKindV1.PRODUCER)
    .with("Consumer", () => KeychainKindV1.CONSUMER)
    .with("Api", () => KeychainKindV1.API)
    .exhaustive();

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

const toKeychainKeyV1 = (key: KeychainKey): KeychainKeyV1 => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt.getTime(),
  encodedPem: key.encodedPem,
  format: toKeyFormatV1(key.format),
  kid: key.kid,
  name: key.name,
  use: toKeyUseV1(key.use),
  userId: key.userId,
});

export const toKeychainV1 = (keychain: Keychain): KeychainV1 => ({
  createdAt: keychain.createdAt.getTime(),
  description: keychain.description,
  id: keychain.id,
  keys: keychain.keys.map(toKeychainKeyV1),
  kind: toKeychainKindV1(keychain.kind),
  name: keychain.name,
  ownerId: keychain.ownerId,
  purposes: keychain.purposes,
  users: keychain.users,
});
