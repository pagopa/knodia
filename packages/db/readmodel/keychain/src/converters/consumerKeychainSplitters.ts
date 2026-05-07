import type { ConsumerKeychainId } from "@knodia/common-models/ids";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  KeychainKey,
  KeychainUser,
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
    toKeychainKeySQL({
      consumerKeychainId: consumerKeychain.id,
      key,
      metadataVersion,
    }),
  );

  const consumerKeychainUsersSQL = consumerKeychain.users.map((user) =>
    toKeychainUserSQL({
      consumerKeychainId: consumerKeychain.id,
      metadataVersion,
      user,
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

const toKeychainKeySQL = ({
  consumerKeychainId,
  key,
  metadataVersion,
}: {
  consumerKeychainId: ConsumerKeychainId;
  key: KeychainKey;
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

const toKeychainUserSQL = ({
  consumerKeychainId,
  metadataVersion,
  user,
}: {
  consumerKeychainId: ConsumerKeychainId;
  metadataVersion: number;
  user: KeychainUser;
}): ConsumerKeychainUserSQL => ({
  addedAt: user.addedAt,
  consumerKeychainId,
  metadataVersion,
  userId: user.userId,
});

export const toConsumerKeychainPurposeSQL = (
  consumerKeychainPurpose: ConsumerKeychainPurpose,
  metadataVersion: number,
): ConsumerKeychainPurposeSQL => ({
  consumerKeychainId: consumerKeychainPurpose.consumerKeychainId,
  linkedAt: consumerKeychainPurpose.linkedAt,
  metadataVersion,
  producerKnodeId: consumerKeychainPurpose.purpose.knodeId,
  purposeId: consumerKeychainPurpose.purpose.id,
});
