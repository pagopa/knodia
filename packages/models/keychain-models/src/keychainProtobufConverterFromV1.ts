import { PurposeId, unsafeBrandId, UserId } from "@knodia/common-models/ids";
import { match } from "ts-pattern";

import {
  KeychainKeyV1,
  KeychainKindV1,
  KeychainV1,
  KeyFormatV1,
  KeyUseV1,
} from "./generated/v1/keychain.ts";
import {
  Keychain,
  KeychainKey,
  KeychainKind,
  KeyFormat,
  KeyUse,
} from "./keychain.ts";

// TODO: move to a shared utilities package
function throwIfMissing<T>(value: T | undefined, message: string): T;
function throwIfMissing<T, R>(
  value: T | undefined,
  message: string,
  converter: (value: T) => R,
): R;
function throwIfMissing<T, R>(
  value: T | undefined,
  message: string,
  converter?: (value: T) => R,
): R | T {
  if (value === undefined) {
    throw new Error(message);
  }
  return converter ? converter(value) : value;
}

export const fromKeychainV1 = (input: KeychainV1): Keychain => ({
  createdAt: new Date(input.createdAt),
  description: input.description,
  id: unsafeBrandId(input.id),
  keys: input.keys.map(fromKeychainKeyV1),
  kind: fromKeychainKindV1(input.kind),
  name: throwIfMissing(input.name, "Keychain name is undefined"),
  ownerId: unsafeBrandId(input.ownerId),
  purposes: input.purposes.map(unsafeBrandId<PurposeId>),
  users: input.users.map(unsafeBrandId<UserId>),
});

const fromKeychainKeyV1 = (input: KeychainKeyV1): KeychainKey => ({
  algorithm: input.algorithm,
  createdAt: new Date(input.createdAt),
  encodedPem: input.encodedPem,
  format: fromKeyFormatV1(input.format),
  kid: input.kid,
  name: throwIfMissing(input.name, "Key name is undefined"),
  use: fromKeyUseV1(input.use),
  userId: unsafeBrandId(input.userId),
});

const fromKeyUseV1 = (input: KeyUseV1): KeyUse =>
  match(input)
    .with(KeyUseV1.ENC, () => KeyUse.enum.enc)
    .with(KeyUseV1.SIG, () => KeyUse.enum.sig)
    .with(KeyUseV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeyUseV1 value");
    })
    .exhaustive();

const fromKeychainKindV1 = (input: KeychainKindV1): KeychainKind =>
  match(input)
    .with(KeychainKindV1.API, () => KeychainKind.enum.Api)
    .with(KeychainKindV1.CONSUMER, () => KeychainKind.enum.Consumer)
    .with(KeychainKindV1.PRODUCER, () => KeychainKind.enum.Producer)
    .with(KeychainKindV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeychainKindV1 value");
    })
    .exhaustive();

const fromKeyFormatV1 = (input: KeyFormatV1): KeyFormat =>
  match(input)
    .with(KeyFormatV1.JWK, () => KeyFormat.enum.jwk)
    .with(KeyFormatV1.X509, () => KeyFormat.enum.x509)
    .with(KeyFormatV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeyFormatV1 value");
    })
    .exhaustive();
