import type { ProducerKeychainId } from "@knodia/common-models/ids";
import type {
  KeychainKey,
  KeychainUser,
  ProducerKeychain,
  ProducerKeychainEservice,
} from "@knodia/keychain-models";

import type {
  ProducerKeychainEserviceSQL,
  ProducerKeychainItemsSQL,
  ProducerKeychainKeySQL,
  ProducerKeychainSQL,
  ProducerKeychainUserSQL,
} from "../producerKeychain.ts";

export const splitProducerKeychainIntoObjectsSQL = (
  producerKeychain: ProducerKeychain,
  metadataVersion: number,
): ProducerKeychainItemsSQL => {
  const producerKeychainSQL = toProducerKeychainSQL(
    producerKeychain,
    metadataVersion,
  );

  const producerKeychainKeysSQL = producerKeychain.keys.map((key) =>
    toKeychainKeySQL({
      key,
      metadataVersion,
      producerKeychainId: producerKeychain.id,
    }),
  );

  const producerKeychainUsersSQL = producerKeychain.users.map((user) =>
    toKeychainUserSQL({
      metadataVersion,
      producerKeychainId: producerKeychain.id,
      user,
    }),
  );

  return {
    producerKeychainKeysSQL,
    producerKeychainSQL,
    producerKeychainUsersSQL,
  };
};

const toProducerKeychainSQL = (
  producerKeychain: ProducerKeychain,
  metadataVersion: number,
): ProducerKeychainSQL => ({
  createdAt: producerKeychain.createdAt,
  // Coerce to null so onConflictDoUpdate emits an explicit SET for the column;
  // a plain `undefined` would be omitted from Drizzle's UPDATE, leaving a stale
  // description in place when the PATCH clears it.
  description: producerKeychain.description ?? null,
  id: producerKeychain.id,
  metadataVersion,
  name: producerKeychain.name,
  ownerId: producerKeychain.ownerId,
  updatedAt: producerKeychain.updatedAt,
});

const toKeychainKeySQL = ({
  key,
  metadataVersion,
  producerKeychainId,
}: {
  key: KeychainKey;
  metadataVersion: number;
  producerKeychainId: ProducerKeychainId;
}): ProducerKeychainKeySQL => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt,
  encodedPem: key.encodedPem,
  format: key.format,
  kid: key.kid,
  metadataVersion,
  name: key.name,
  producerKeychainId,
  userId: key.userId,
});

const toKeychainUserSQL = ({
  metadataVersion,
  producerKeychainId,
  user,
}: {
  metadataVersion: number;
  producerKeychainId: ProducerKeychainId;
  user: KeychainUser;
}): ProducerKeychainUserSQL => ({
  addedAt: user.addedAt,
  metadataVersion,
  producerKeychainId,
  userId: user.userId,
});

export const toProducerKeychainEserviceSQL = (
  producerKeychainEservice: ProducerKeychainEservice,
  metadataVersion: number,
): ProducerKeychainEserviceSQL => ({
  eserviceId: producerKeychainEservice.eserviceId,
  linkedAt: producerKeychainEservice.linkedAt,
  metadataVersion,
  producerKeychainId: producerKeychainEservice.producerKeychainId,
});
