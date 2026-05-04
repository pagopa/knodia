import type { KnodeApiKeychainId } from "@knodia/common-models/ids";
import type {
  ConsumerKeychainKey,
  ConsumerKeychainUser,
  KnodeApiKeychain,
} from "@knodia/keychain-models";

import type {
  KnodeApiKeychainItemsSQL,
  KnodeApiKeychainKeySQL,
  KnodeApiKeychainSQL,
  KnodeApiKeychainUserSQL,
} from "../knodeApiKeychain.ts";

export const splitKnodeApiKeychainIntoObjectsSQL = (
  knodeApiKeychain: KnodeApiKeychain,
  metadataVersion: number,
): KnodeApiKeychainItemsSQL => {
  const knodeApiKeychainSQL = toKnodeApiKeychainSQL(
    knodeApiKeychain,
    metadataVersion,
  );

  const knodeApiKeychainKeysSQL = knodeApiKeychain.keys.map((key) =>
    toKnodeApiKeychainKeySQL({
      key,
      knodeApiKeychainId: knodeApiKeychain.id,
      metadataVersion,
    }),
  );

  const knodeApiKeychainUsersSQL = knodeApiKeychain.users.map((user) =>
    toKnodeApiKeychainUserSQL({
      knodeApiKeychainId: knodeApiKeychain.id,
      metadataVersion,
      user,
    }),
  );

  return {
    knodeApiKeychainKeysSQL,
    knodeApiKeychainSQL,
    knodeApiKeychainUsersSQL,
  };
};

const toKnodeApiKeychainKeySQL = ({
  key,
  knodeApiKeychainId,
  metadataVersion,
}: {
  key: ConsumerKeychainKey;
  knodeApiKeychainId: KnodeApiKeychainId;
  metadataVersion: number;
}): KnodeApiKeychainKeySQL => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt,
  encodedPem: key.encodedPem,
  format: key.format,
  kid: key.kid,
  knodeApiKeychainId,
  metadataVersion,
  name: key.name,
  userId: key.userId,
});

const toKnodeApiKeychainSQL = (
  knodeApiKeychain: KnodeApiKeychain,
  metadataVersion: number,
): KnodeApiKeychainSQL => ({
  createdAt: knodeApiKeychain.createdAt,
  description: knodeApiKeychain.description,
  id: knodeApiKeychain.id,
  metadataVersion,
  name: knodeApiKeychain.name,
  ownerId: knodeApiKeychain.ownerId,
  updatedAt: knodeApiKeychain.updatedAt,
});

const toKnodeApiKeychainUserSQL = ({
  knodeApiKeychainId,
  metadataVersion,
  user,
}: {
  knodeApiKeychainId: KnodeApiKeychainId;
  metadataVersion: number;
  user: ConsumerKeychainUser;
}): KnodeApiKeychainUserSQL => ({
  addedAt: user.addedAt,
  knodeApiKeychainId,
  metadataVersion,
  userId: user.userId,
});
