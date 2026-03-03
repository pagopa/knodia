import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  OrganizationId,
  PurposeId,
  unsafeBrandId,
  UserId,
} from "@knodia/common-models/ids";
import {
  ConsumerKeychain,
  type ConsumerKeychainKey,
  KeyAlgorithm,
  KeyFormat,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  ConsumerKeychainItemsSQL,
  ConsumerKeychainKeySQL,
} from "../consumerKeychain.ts";

export const buildConsumerKeychain = ({
  consumerKeychainKeysSQL,
  consumerKeychainPurposesSQL,
  consumerKeychainSQL,
  consumerKeychainUsersSQL,
}: ConsumerKeychainItemsSQL): WithMetadata<ConsumerKeychain> => {
  const consumerKeychain: ConsumerKeychain = {
    createdAt: consumerKeychainSQL.createdAt,
    description:
      consumerKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(consumerKeychainSQL.description),
    id: unsafeBrandId(consumerKeychainSQL.id),
    keys: consumerKeychainKeysSQL.map(buildConsumerKeychainKey),
    name: LocalizedName.parse(consumerKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(consumerKeychainSQL.ownerId),
    purposes: consumerKeychainPurposesSQL.map((purposeSQL) =>
      unsafeBrandId<PurposeId>(purposeSQL.purposeId),
    ),
    updatedAt: consumerKeychainSQL.updatedAt,
    users: consumerKeychainUsersSQL.map((userSQL) =>
      unsafeBrandId<UserId>(userSQL.userId),
    ),
  };

  return {
    data: consumerKeychain,
    metadata: { version: consumerKeychainSQL.metadataVersion },
  };
};

export function buildConsumerKeychainKey(
  keySQL: ConsumerKeychainKeySQL,
): ConsumerKeychainKey {
  return {
    algorithm: KeyAlgorithm.parse(keySQL.algorithm),
    createdAt: keySQL.createdAt,
    encodedPem: keySQL.encodedPem,
    format: KeyFormat.parse(keySQL.format),
    kid: keySQL.kid,
    name: LocalizedName.parse(keySQL.name),
    userId: unsafeBrandId<UserId>(keySQL.userId),
  };
}
