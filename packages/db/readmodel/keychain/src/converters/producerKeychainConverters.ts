import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { type OrganizationId, unsafeBrandId } from "@knodia/common-models/ids";
import {
  type FlatProducerKeychain,
  LocalizedDescription,
  LocalizedName,
  type ProducerKeychain,
  type ProducerKeychainEservice,
} from "@knodia/keychain-models";

import type {
  FlatProducerKeychainItemsSQL,
  ProducerKeychainEserviceSQL,
  ProducerKeychainItemsSQL,
} from "../producerKeychain.ts";

import { toKeychainKey, toKeychainUser } from "./keychainConverters.ts";

export const buildProducerKeychain = ({
  producerKeychainKeysSQL,
  producerKeychainSQL,
  producerKeychainUsersSQL,
}: ProducerKeychainItemsSQL): WithMetadata<ProducerKeychain> => {
  const producerKeychain: ProducerKeychain = {
    createdAt: producerKeychainSQL.createdAt,
    description:
      producerKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(producerKeychainSQL.description),
    id: unsafeBrandId(producerKeychainSQL.id),
    keys: producerKeychainKeysSQL.map(toKeychainKey),
    name: LocalizedName.parse(producerKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(producerKeychainSQL.ownerId),
    updatedAt: producerKeychainSQL.updatedAt,
    users: producerKeychainUsersSQL.map(toKeychainUser),
  };

  return {
    data: producerKeychain,
    metadata: { version: producerKeychainSQL.metadataVersion },
  };
};

export const buildFlatProducerKeychain = ({
  producerKeychainSQL,
}: FlatProducerKeychainItemsSQL): WithMetadata<FlatProducerKeychain> => {
  const producerKeychain: FlatProducerKeychain = {
    createdAt: producerKeychainSQL.createdAt,
    description:
      producerKeychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(producerKeychainSQL.description),
    id: unsafeBrandId(producerKeychainSQL.id),
    name: LocalizedName.parse(producerKeychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(producerKeychainSQL.ownerId),
    updatedAt: producerKeychainSQL.updatedAt,
  };

  return {
    data: producerKeychain,
    metadata: { version: producerKeychainSQL.metadataVersion },
  };
};

export function toProducerKeychainEservice(
  producerKeychainEserviceSQL: ProducerKeychainEserviceSQL,
): WithMetadata<ProducerKeychainEservice> {
  return {
    data: {
      eserviceId: unsafeBrandId(producerKeychainEserviceSQL.eserviceId),
      linkedAt: producerKeychainEserviceSQL.linkedAt,
      producerKeychainId: unsafeBrandId(
        producerKeychainEserviceSQL.producerKeychainId,
      ),
    },
    metadata: { version: producerKeychainEserviceSQL.metadataVersion },
  };
}
