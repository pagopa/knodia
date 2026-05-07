import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { type OrganizationId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  type FlatKnodeApiKeychain,
  type KnodeApiKeychain,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  FlatKnodeApiKeychainItemsSQL,
  KnodeApiKeychainItemsSQL,
} from "../knodeApiKeychain.ts";

import { toKeychainKey, toKeychainUser } from "./keychainConverters.ts";

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
    keys: knodeApiKeychainKeysSQL.map(toKeychainKey),
    name: LocalizedName.parse(knodeApiKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(knodeApiKeychainSQL.ownerId),
    updatedAt: knodeApiKeychainSQL.updatedAt,
    users: knodeApiKeychainUsersSQL.map(toKeychainUser),
  };

  return {
    data: knodeApiKeychain,
    metadata: { version: knodeApiKeychainSQL.metadataVersion },
  };
};
