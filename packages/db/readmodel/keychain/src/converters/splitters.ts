import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type {
  ConsumerKeychain,
  ConsumerKeychainKey,
  ConsumerKeychainPurpose,
} from "@knodia/keychain-models";

import type {
  ConsumerKeychainItemsSQL,
  ConsumerKeychainKeySQL,
  ConsumerKeychainPurposeSQL,
  ConsumerKeychainSQL,
  ConsumerKeychainUserSQL,
} from "../consumerKeychain.ts";

export const splitConsumerKeychainIntoObjectsSQL = (
  consumerKeychain: ConsumerKeychain,
  metadataVersion: number,
): ConsumerKeychainItemsSQL => {
  const consumerKeychainSQL = toConsumerKeychainSQL(
    consumerKeychain,
    metadataVersion,
  );

  const consumerKeychainKeysSQL = consumerKeychain.keys.map((key) =>
    toConsumerKeychainKeySQL({
      consumerKeychainId: consumerKeychain.id,
      key,
      metadataVersion,
    }),
  );

  const consumerKeychainUsersSQL = consumerKeychain.users.map((userId) =>
    toConsumerKeychainUserSQL({
      consumerKeychainId: consumerKeychain.id,
      metadataVersion,
      userId,
    }),
  );

  return {
    consumerKeychainKeysSQL,
    consumerKeychainSQL,
    consumerKeychainUsersSQL,
  };
};

const toConsumerKeychainSQL = (
  consumerKeychain: ConsumerKeychain,
  metadataVersion: number,
): ConsumerKeychainSQL => ({
  createdAt: consumerKeychain.createdAt,
  description: consumerKeychain.description,
  id: consumerKeychain.id,
  metadataVersion,
  name: consumerKeychain.name,
  ownerId: consumerKeychain.ownerId,
  updatedAt: consumerKeychain.updatedAt,
});

const toConsumerKeychainKeySQL = ({
  consumerKeychainId,
  key,
  metadataVersion,
}: {
  consumerKeychainId: ConsumerKeychainId;
  key: ConsumerKeychainKey;
  metadataVersion: number;
}): ConsumerKeychainKeySQL => ({
  algorithm: key.algorithm,
  consumerKeychainId,
  createdAt: key.createdAt,
  encodedPem: key.encodedPem,
  format: key.format,
  kid: key.kid,
  metadataVersion,
  name: key.name,
  userId: key.userId,
});

/** @knipignore -  Will be used when implementing the keychain users lifecycle */
export const toConsumerKeychainUserSQL = ({
  consumerKeychainId,
  metadataVersion,
  userId,
}: {
  consumerKeychainId: ConsumerKeychainId;
  metadataVersion: number;
  userId: ConsumerKeychainUserSQL["userId"];
}): ConsumerKeychainUserSQL => ({
  consumerKeychainId,
  metadataVersion,
  userId,
});

/** @knipignore -  Will be used when implementing the consumer keychain purposes lifecycle */
export const toConsumerKeychainPurposeSQL = (
  consumerKeychainPurpose: ConsumerKeychainPurpose,
  metadataVersion: number,
): ConsumerKeychainPurposeSQL => ({
  ...consumerKeychainPurpose,
  metadataVersion,
});
