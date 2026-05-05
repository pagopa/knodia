import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type OrganizationId,
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import {
  type FlatKnodeApiKeychain,
  KeyAlgorithm,
  type KeychainKey,
  KeyFormat,
  type KnodeApiKeychain,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  FlatKnodeApiKeychainItemsSQL,
  KnodeApiKeychainItemsSQL,
  KnodeApiKeychainKeySQL,
} from "../knodeApiKeychain.ts";

export const buildFlatKnodeApiKeychain = ({
  knodeApiKeychainSQL,
}: FlatKnodeApiKeychainItemsSQL): WithMetadata<FlatKnodeApiKeychain> => {
  const knodeApiKeychain: FlatKnodeApiKeychain = {
    createdAt: knodeApiKeychainSQL.createdAt,
    description:
      knodeApiKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(knodeApiKeychainSQL.description),
    id: unsafeBrandId(knodeApiKeychainSQL.id),
    name: LocalizedName.parse(knodeApiKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(knodeApiKeychainSQL.ownerId),
    updatedAt: knodeApiKeychainSQL.updatedAt,
  };

  return {
    data: knodeApiKeychain,
    metadata: { version: knodeApiKeychainSQL.metadataVersion },
  };
};

export const buildKnodeApiKeychain = ({
  knodeApiKeychainKeysSQL,
  knodeApiKeychainSQL,
  knodeApiKeychainUsersSQL,
}: KnodeApiKeychainItemsSQL): WithMetadata<KnodeApiKeychain> => {
  const knodeApiKeychain: KnodeApiKeychain = {
    createdAt: knodeApiKeychainSQL.createdAt,
    description:
      knodeApiKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(knodeApiKeychainSQL.description),
    id: unsafeBrandId(knodeApiKeychainSQL.id),
    keys: knodeApiKeychainKeysSQL.map(toKnodeApiKeychainKey),
    name: LocalizedName.parse(knodeApiKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(knodeApiKeychainSQL.ownerId),
    updatedAt: knodeApiKeychainSQL.updatedAt,
    users: knodeApiKeychainUsersSQL.map((userSQL) => ({
      addedAt: userSQL.addedAt,
      userId: unsafeBrandUserId(userSQL.userId),
    })),
  };

  return {
    data: knodeApiKeychain,
    metadata: { version: knodeApiKeychainSQL.metadataVersion },
  };
};

/** @knipignore */
export function toKnodeApiKeychainKey(
  keySQL: KnodeApiKeychainKeySQL,
): KeychainKey {
  return {
    algorithm: KeyAlgorithm.parse(keySQL.algorithm),
    createdAt: keySQL.createdAt,
    encodedPem: keySQL.encodedPem,
    format: KeyFormat.parse(keySQL.format),
    kid: unsafeBrandKeyId(keySQL.kid),
    name: LocalizedName.parse(keySQL.name),
    userId: unsafeBrandUserId(keySQL.userId),
  };
}
