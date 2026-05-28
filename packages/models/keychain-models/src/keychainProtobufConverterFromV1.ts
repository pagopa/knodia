import {
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  type KeychainKeyV1,
  type KeychainUserV1,
  KeyFormatV1,
  type KnodeApiKeychainV1,
  type ProducerKeychainV1,
} from "./generated/v1/keychain.ts";
import {
  type ConsumerKeychain,
  KeyAlgorithm,
  type KeychainKey,
  type KeychainUser,
  KeyFormat,
  type KnodeApiKeychain,
  type ProducerKeychain,
} from "./keychain.ts";

export const fromConsumerKeychainV1 = (
  input: ConsumerKeychainV1,
): ConsumerKeychain => {
  assertRequired(input.name, "ConsumerKeychain name is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    keys: input.keys.map(fromKeychainKeyV1),
    name: input.name,
    ownerId: unsafeBrandId(input.ownerId),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(fromKeychainUserV1),
  };
};

const fromKeychainKeyV1 = (input: KeychainKeyV1): KeychainKey => {
  assertRequired(input.name, "Key name is undefined");

  return {
    ...input,
    algorithm: fromKeyAlgorithmV1(input.algorithm),
    createdAt: new Date(input.createdAt),
    format: fromKeyFormatV1(input.format),
    kid: unsafeBrandKeyId(input.kid),
    name: input.name,
    userId: unsafeBrandUserId(input.userId),
  };
};

const fromKeychainUserV1 = (input: KeychainUserV1): KeychainUser => ({
  addedAt: new Date(input.addedAt),
  userId: unsafeBrandUserId(input.userId),
});

const fromKeyAlgorithmV1 = (input: KeyAlgorithmV1): KeyAlgorithm =>
  match(input)
    .with(KeyAlgorithmV1.RS256, () => KeyAlgorithm.enum.RS256)
    .with(KeyAlgorithmV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeyAlgorithmV1 value");
    })
    .exhaustive();

const fromKeyFormatV1 = (input: KeyFormatV1): KeyFormat =>
  match(input)
    .with(KeyFormatV1.PublicKey, () => KeyFormat.enum.PublicKey)
    .with(KeyFormatV1.X509Certificate, () => KeyFormat.enum.X509Certificate)
    .with(KeyFormatV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeyFormatV1 value");
    })
    .exhaustive();

export const fromKnodeApiKeychainV1 = (
  input: KnodeApiKeychainV1,
): KnodeApiKeychain => {
  assertRequired(input.name, "KnodeApiKeychain name is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    keys: input.keys.map(fromKeychainKeyV1),
    name: input.name,
    ownerId: unsafeBrandId(input.ownerId),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(fromKeychainUserV1),
  };
};

export const fromProducerKeychainV1 = (
  input: ProducerKeychainV1,
): ProducerKeychain => {
  assertRequired(input.name, "ProducerKeychain name is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    keys: input.keys.map(fromKeychainKeyV1),
    name: input.name,
    ownerId: unsafeBrandId(input.ownerId),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(fromKeychainUserV1),
  };
};
