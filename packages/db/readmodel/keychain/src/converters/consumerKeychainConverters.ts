import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  type FlatConsumerKeychain,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  ConsumerKeychainItemsSQL,
  ConsumerKeychainPurposeSQL,
  FlatConsumerKeychainItemsSQL,
} from "../consumerKeychain.ts";

import { toKeychainKey, toKeychainUser } from "./keychainConverters.ts";

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
    keys: consumerKeychainKeysSQL.map(toKeychainKey),
    name: LocalizedName.parse(consumerKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(consumerKeychainSQL.ownerId),
    updatedAt: consumerKeychainSQL.updatedAt,
    users: consumerKeychainUsersSQL.map(toKeychainUser),
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
