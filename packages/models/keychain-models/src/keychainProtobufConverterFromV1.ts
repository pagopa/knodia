import {
  type PurposeId,
  unsafeBrandId,
  type UserId,
} from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  type ConsumerKeychainKeyV1,
  type ConsumerKeychainV1,
  KeyAlgorithmV1,
  KeyFormatV1,
} from "./generated/v1/keychain.ts";
import {
  type ConsumerKeychain,
  type ConsumerKeychainKey,
  KeyAlgorithm,
  KeyFormat,
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
    purposes: input.purposes.map(unsafeBrandId<PurposeId>),
    updatedAt: new Date(input.updatedAt),
    users: input.users.map(unsafeBrandId<UserId>),
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
    name: input.name,
    userId: unsafeBrandId(input.userId),
  };
};

const fromKeyAlgorithmV1 = (input: KeyAlgorithmV1): KeyAlgorithm =>
  match(input)
    .with(KeyAlgorithmV1.RS256, () => KeyAlgorithm.enum.RS256)
    .with(KeyAlgorithmV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeyAlgorithmV1 value");
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
