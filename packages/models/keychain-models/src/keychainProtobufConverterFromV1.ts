import {
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  type ConsumerKeychainKeyV1,
  type ConsumerKeychainUserV1,
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  KeyFormatV1,
  type KnodiaApiKeychainKeyV1,
  type KnodiaApiKeychainUserV1,
  type KnodiaApiKeychainV1,
} from "./generated/v1/keychain.ts";
import {
  type ConsumerKeychain,
  type ConsumerKeychainKey,
  type ConsumerKeychainUser,
  KeyAlgorithm,
  KeyFormat,
  type KnodiaApiKeychain,
  type KnodiaApiKeychainKey,
  type KnodiaApiKeychainUser,
} from "./keychain.ts";

export const fromConsumerKeychainV1 = (
  input: ConsumerKeychainV1,
): ConsumerKeychain => {
  assertRequired(input.name, "ConsumerKeychain name is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    keys: input.keys.map(fromConsumerKeychainKeyV1),
    name: input.name,
    ownerId: unsafeBrandId(input.ownerId),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(fromConsumerKeychainUserV1),
  };
};

const fromConsumerKeychainKeyV1 = (
  input: ConsumerKeychainKeyV1,
): ConsumerKeychainKey => {
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

const fromConsumerKeychainUserV1 = (
  input: ConsumerKeychainUserV1,
): ConsumerKeychainUser => ({
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

export const fromKnodiaApiKeychainV1 = (
  input: KnodiaApiKeychainV1,
): KnodiaApiKeychain => {
  assertRequired(input.name, "KnodiaApiKeychain name is undefined");

  return {
    ...input,
    createdAt: new Date(input.createdAt),
    id: unsafeBrandId(input.id),
    keys: input.keys.map(fromKnodiaApiKeychainKeyV1),
    name: input.name,
    ownerId: unsafeBrandId(input.ownerId),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(fromKnodiaApiKeychainUserV1),
  };
};

const fromKnodiaApiKeychainKeyV1 = (
  input: KnodiaApiKeychainKeyV1,
): KnodiaApiKeychainKey => {
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

const fromKnodiaApiKeychainUserV1 = (
  input: KnodiaApiKeychainUserV1,
): KnodiaApiKeychainUser => ({
  addedAt: new Date(input.addedAt),
  userId: unsafeBrandUserId(input.userId),
});
