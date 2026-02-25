import { PurposeId, unsafeBrandId, UserId } from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
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

export const fromKeychainV1 = (input: KeychainV1): Keychain => {
  assertRequired(input.name, "Keychain name is undefined");

  return {
    createdAt: new Date(input.createdAt),
    description: input.description,
    id: unsafeBrandId(input.id),
    keys: input.keys.map(fromKeychainKeyV1),
    kind: fromKeychainKindV1(input.kind),
    name: input.name,
    ownerId: unsafeBrandId(input.ownerId),
    purposes: input.purposes.map(unsafeBrandId<PurposeId>),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(unsafeBrandId<UserId>),
  };
};

const fromKeychainKeyV1 = (input: KeychainKeyV1): KeychainKey => {
  assertRequired(input.name, "Key name is undefined");

  return {
    algorithm: input.algorithm,
    createdAt: new Date(input.createdAt),
    encodedPem: input.encodedPem,
    format: fromKeyFormatV1(input.format),
    kid: input.kid,
    name: input.name,
    use: fromKeyUseV1(input.use),
    userId: unsafeBrandId(input.userId),
  };
};

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
