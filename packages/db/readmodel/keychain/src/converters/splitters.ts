import type { KeychainId } from "@knodia/common-models/ids";
import type { Keychain, KeychainKey } from "@knodia/keychain-models";

import type {
  KeychainItemsSQL,
  KeychainKeySQL,
  KeychainPurposeSQL,
  KeychainSQL,
  KeychainUserSQL,
} from "../keychain.ts";

export const splitKeychainIntoObjectsSQL = (
  keychain: Keychain,
  metadataVersion: number,
): KeychainItemsSQL => {
  const keychainSQL = toKeychainSQL(keychain, metadataVersion);

  const keychainKeysSQL = keychain.keys.map((key) =>
    toKeychainKeySQL({
      key,
      keychainId: keychain.id,
      metadataVersion,
    }),
  );

  const keychainUsersSQL = keychain.users.map((userId) => ({
    keychainId: keychain.id,
    metadataVersion,
    userId,
  }));

  const keychainPurposesSQL = keychain.purposes.map((purposeId) => ({
    keychainId: keychain.id,
    metadataVersion,
    purposeId,
  }));

  return {
    keychainKeysSQL,
    keychainPurposesSQL,
    keychainSQL,
    keychainUsersSQL,
  };
};

const toKeychainSQL = (
  keychain: Keychain,
  metadataVersion: number,
): KeychainSQL => ({
  createdAt: keychain.createdAt,
  description: keychain.description,
  id: keychain.id,
  kind: keychain.kind,
  metadataVersion,
  name: keychain.name,
  ownerId: keychain.ownerId,
  updatedAt: keychain.updatedAt,
});

const toKeychainKeySQL = ({
  key,
  keychainId,
  metadataVersion,
}: {
  key: KeychainKey;
  keychainId: KeychainId;
  metadataVersion: number;
}): KeychainKeySQL => ({
  algorithm: key.algorithm,
  createdAt: key.createdAt,
  encodedPem: key.encodedPem,
  format: key.format,
  keychainId,
  kid: key.kid,
  metadataVersion,
  name: key.name,
  use: key.use,
  userId: key.userId,
});

export const toKeychainUserSQL = ({
  keychainId,
  metadataVersion,
  userId,
}: {
  keychainId: KeychainId;
  metadataVersion: number;
  userId: KeychainUserSQL["userId"];
}): KeychainUserSQL => ({
  keychainId,
  metadataVersion,
  userId,
});

export const toKeychainPurposeSQL = ({
  keychainId,
  metadataVersion,
  purposeId,
}: {
  keychainId: KeychainId;
  metadataVersion: number;
  purposeId: KeychainPurposeSQL["purposeId"];
}): KeychainPurposeSQL => ({
  keychainId,
  metadataVersion,
  purposeId,
});
