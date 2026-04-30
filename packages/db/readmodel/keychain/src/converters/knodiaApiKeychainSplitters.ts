import type { KnodiaApiKeychainId } from "@knodia/common-models/ids";
import type {
  KnodiaApiKeychain,
  KnodiaApiKeychainKey,
  KnodiaApiKeychainUser,
} from "@knodia/keychain-models";

import type {
  KnodiaApiKeychainItemsSQL,
  KnodiaApiKeychainKeySQL,
  KnodiaApiKeychainSQL,
  KnodiaApiKeychainUserSQL,
} from "../knodiaApiKeychain.ts";

export const splitKnodiaApiKeychainIntoObjectsSQL = (
  knodiaApiKeychain: KnodiaApiKeychain,
  metadataVersion: number,
): KnodiaApiKeychainItemsSQL => {
  const knodiaApiKeychainSQL = toKnodiaApiKeychainSQL(
    knodiaApiKeychain,
    metadataVersion,
  );

  const knodiaApiKeychainKeysSQL = knodiaApiKeychain.keys.map((key) =>
    toKnodiaApiKeychainKeySQL({
      key,
      knodiaApiKeychainId: knodiaApiKeychain.id,
      metadataVersion,
    }),
  );

  const knodiaApiKeychainUsersSQL = knodiaApiKeychain.users.map((user) =>
    toKnodiaApiKeychainUserSQL({
      knodiaApiKeychainId: knodiaApiKeychain.id,
      metadataVersion,
      user,
    }),
  );

  return {
    knodiaApiKeychainKeysSQL,
    knodiaApiKeychainSQL,
    knodiaApiKeychainUsersSQL,
  };
};

const toKnodiaApiKeychainSQL = (
  knodiaApiKeychain: KnodiaApiKeychain,
  metadataVersion: number,
): KnodiaApiKeychainSQL => ({
  createdAt: knodiaApiKeychain.createdAt,
  description: knodiaApiKeychain.description,
  id: knodiaApiKeychain.id,
  metadataVersion,
  name: knodiaApiKeychain.name,
  ownerId: knodiaApiKeychain.ownerId,
  updatedAt: knodiaApiKeychain.updatedAt,
});

const toKnodiaApiKeychainKeySQL = ({
  key,
  knodiaApiKeychainId,
  metadataVersion,
}: {
  key: KnodiaApiKeychainKey;
  knodiaApiKeychainId: KnodiaApiKeychainId;
  metadataVersion: number;
}): KnodiaApiKeychainKeySQL => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt,
  encodedPem: key.encodedPem,
  format: key.format,
  kid: key.kid,
  knodiaApiKeychainId,
  metadataVersion,
  name: key.name,
  userId: key.userId,
});

const toKnodiaApiKeychainUserSQL = ({
  knodiaApiKeychainId,
  metadataVersion,
  user,
}: {
  knodiaApiKeychainId: KnodiaApiKeychainId;
  metadataVersion: number;
  user: KnodiaApiKeychainUser;
}): KnodiaApiKeychainUserSQL => ({
  addedAt: user.addedAt,
  knodiaApiKeychainId,
  metadataVersion,
  userId: user.userId,
});
