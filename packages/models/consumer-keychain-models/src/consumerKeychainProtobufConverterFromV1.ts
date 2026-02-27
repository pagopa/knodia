import { PurposeId, unsafeBrandId, UserId } from "@knodia/common-models/ids";
import { assertRequired } from "@knodia/common-models/utils";
import { match } from "ts-pattern";

import {
  ConsumerKeychain,
  ConsumerKeychainKey,
  KeyFormat,
  KeyUse,
} from "./consumerKeychain.ts";
import {
  ConsumerKeychainKeyV1,
  ConsumerKeychainV1,
  KeyFormatV1,
  KeyUseV1,
} from "./generated/v1/consumerKeychain.ts";

export const fromConsumerKeychainV1 = (
  input: ConsumerKeychainV1,
): ConsumerKeychain => {
  assertRequired(input.name, "ConsumerKeychain name is undefined");

  return {
    createdAt: new Date(input.createdAt),
    description: input.description,
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

const fromKeyFormatV1 = (input: KeyFormatV1): KeyFormat =>
  match(input)
    .with(KeyFormatV1.JWK, () => KeyFormat.enum.jwk)
    .with(KeyFormatV1.X509, () => KeyFormat.enum.x509)
    .with(KeyFormatV1.UNRECOGNIZED, () => {
      throw new Error("Unrecognized KeyFormatV1 value");
    })
    .exhaustive();
