import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
} from "@knodia/common-models/ids";
import {
  type ConsumerKeychain,
  type ConsumerKeychainKey,
  type ConsumerKeychainPurpose,
  ConsumerKeychainUser,
  type FlatConsumerKeychain,
  KeyAlgorithm,
  KeyFormat,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  ConsumerKeychainItemsSQL,
  ConsumerKeychainKeySQL,
  ConsumerKeychainPurposeSQL,
  ConsumerKeychainUserSQL,
  FlatConsumerKeychainItemsSQL,
} from "../consumerKeychain.ts";

export const buildConsumerKeychain = ({
  consumerKeychainKeysSQL,
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
    keys: consumerKeychainKeysSQL.map(toConsumerKeychainKey),
    name: LocalizedName.parse(consumerKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(consumerKeychainSQL.ownerId),
    updatedAt: consumerKeychainSQL.updatedAt,
    users: consumerKeychainUsersSQL.map(toConsumerKeychainUser),
  };

  return {
    data: consumerKeychain,
    metadata: { version: consumerKeychainSQL.metadataVersion },
  };
};

export const buildFlatConsumerKeychain = ({
  consumerKeychainSQL,
}: FlatConsumerKeychainItemsSQL): WithMetadata<FlatConsumerKeychain> => {
  const consumerKeychain: FlatConsumerKeychain = {
    createdAt: consumerKeychainSQL.createdAt,
    description:
      consumerKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(consumerKeychainSQL.description),
    id: unsafeBrandId(consumerKeychainSQL.id),
    name: LocalizedName.parse(consumerKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(consumerKeychainSQL.ownerId),
    updatedAt: consumerKeychainSQL.updatedAt,
  };

  return {
    data: consumerKeychain,
    metadata: { version: consumerKeychainSQL.metadataVersion },
  };
};

export function toConsumerKeychainKey(
  keySQL: ConsumerKeychainKeySQL,
): ConsumerKeychainKey {
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

export function toConsumerKeychainPurpose(
  consumerKeychainPurposeSQL: ConsumerKeychainPurposeSQL,
): WithMetadata<ConsumerKeychainPurpose> {
  return {
    data: {
      consumerKeychainId: unsafeBrandId(
        consumerKeychainPurposeSQL.consumerKeychainId,
      ),
      linkedAt: consumerKeychainPurposeSQL.linkedAt,
      purpose: {
        id: unsafeBrandExternalId(consumerKeychainPurposeSQL.purposeId),
        knodeId: KnodeId.parse(consumerKeychainPurposeSQL.producerKnodeId),
      },
    },
    metadata: { version: consumerKeychainPurposeSQL.metadataVersion },
  };
}

export function toConsumerKeychainUser(
  userSQL: ConsumerKeychainUserSQL,
): ConsumerKeychainUser {
  return {
    addedAt: userSQL.addedAt,
    userId: unsafeBrandUserId(userSQL.userId),
  };
}
