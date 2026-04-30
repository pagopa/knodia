import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type OrganizationId,
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import {
  type FlatKnodiaApiKeychain,
  KeyAlgorithm,
  KeyFormat,
  type KnodiaApiKeychain,
  type KnodiaApiKeychainKey,
  type KnodiaApiKeychainUser,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  FlatKnodiaApiKeychainItemsSQL,
  KnodiaApiKeychainItemsSQL,
  KnodiaApiKeychainKeySQL,
  KnodiaApiKeychainUserSQL,
} from "../knodiaApiKeychain.ts";

export const buildKnodiaApiKeychain = ({
  knodiaApiKeychainKeysSQL,
  knodiaApiKeychainSQL,
  knodiaApiKeychainUsersSQL,
}: KnodiaApiKeychainItemsSQL): WithMetadata<KnodiaApiKeychain> => {
  const knodiaApiKeychain: KnodiaApiKeychain = {
    createdAt: knodiaApiKeychainSQL.createdAt,
    description:
      knodiaApiKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(knodiaApiKeychainSQL.description),
    id: unsafeBrandId(knodiaApiKeychainSQL.id),
    keys: knodiaApiKeychainKeysSQL.map(toKnodiaApiKeychainKey),
    name: LocalizedName.parse(knodiaApiKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(knodiaApiKeychainSQL.ownerId),
    updatedAt: knodiaApiKeychainSQL.updatedAt,
    users: knodiaApiKeychainUsersSQL.map(toKnodiaApiKeychainUser),
  };

  return {
    data: knodiaApiKeychain,
    metadata: { version: knodiaApiKeychainSQL.metadataVersion },
  };
};

export const buildFlatKnodiaApiKeychain = ({
  knodiaApiKeychainSQL,
}: FlatKnodiaApiKeychainItemsSQL): WithMetadata<FlatKnodiaApiKeychain> => {
  const knodiaApiKeychain: FlatKnodiaApiKeychain = {
    createdAt: knodiaApiKeychainSQL.createdAt,
    description:
      knodiaApiKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(knodiaApiKeychainSQL.description),
    id: unsafeBrandId(knodiaApiKeychainSQL.id),
    name: LocalizedName.parse(knodiaApiKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(knodiaApiKeychainSQL.ownerId),
    updatedAt: knodiaApiKeychainSQL.updatedAt,
  };

  return {
    data: knodiaApiKeychain,
    metadata: { version: knodiaApiKeychainSQL.metadataVersion },
  };
};

export function toKnodiaApiKeychainKey(
  keySQL: KnodiaApiKeychainKeySQL,
): KnodiaApiKeychainKey {
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

function toKnodiaApiKeychainUser(
  userSQL: KnodiaApiKeychainUserSQL,
): KnodiaApiKeychainUser {
  return {
    addedAt: userSQL.addedAt,
    userId: unsafeBrandUserId(userSQL.userId),
  };
}
