import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type ConsumerKeychainId,
  OrganizationId,
  type PurposeId,
  unsafeBrandId,
  type UserId,
} from "@knodia/common-models/ids";
import {
  ConsumerKeychain,
  ConsumerKeychainKey,
  KeyFormat,
  KeyUse,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/consumer-keychain-models";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";

import {
  type ConsumerKeychainItemsSQL,
  type ConsumerKeychainKeySQL,
  type ConsumerKeychainPurposeSQL,
  type ConsumerKeychainSQL,
  type ConsumerKeychainUserSQL,
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainPurpose,
  readmodelConsumerKeychainUser,
} from "../consumerKeychain.ts";

type ConsumerKeychainAggregatorInput = {
  consumerKeychain: ConsumerKeychainSQL;
  key?: ConsumerKeychainKeySQL | null;
  purpose?: ConsumerKeychainPurposeSQL | null;
  user?: ConsumerKeychainUserSQL | null;
}[];

const buildConsumerKeychain = ({
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

function buildConsumerKeychainKey(
  keySQL: ConsumerKeychainKeySQL,
): ConsumerKeychainKey {
  return {
    algorithm: keySQL.algorithm,
    createdAt: keySQL.createdAt,
    encodedPem: keySQL.encodedPem,
    format: KeyFormat.parse(keySQL.format),
    kid: keySQL.kid,
    name: LocalizedName.parse(keySQL.name),
    use: KeyUse.parse(keySQL.use),
    userId: unsafeBrandId<UserId>(keySQL.userId),
  };
}

export const aggregateConsumerKeychain = (
  queryRes: ConsumerKeychainAggregatorInput,
): undefined | WithMetadata<ConsumerKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildConsumerKeychain(toConsumerKeychainAggregator(queryRes));
};

export const aggregateConsumerKeychains = (
  queryRes: ConsumerKeychainAggregatorInput,
): WithMetadata<ConsumerKeychain>[] => {
  const { consumerKeychainsSQL, keysSQL, purposesSQL, usersSQL } =
    toConsumerKeychainsAggregator(queryRes);

  const keysSQLByConsumerKeychainId =
    createConsumerKeychainSQLPropertyMap(keysSQL);
  const purposesSQLByConsumerKeychainId =
    createConsumerKeychainSQLPropertyMap(purposesSQL);
  const usersSQLByConsumerKeychainId =
    createConsumerKeychainSQLPropertyMap(usersSQL);

  return consumerKeychainsSQL.map((consumerKeychainSQL) => {
    const consumerKeychainId = unsafeBrandId<ConsumerKeychainId>(
      consumerKeychainSQL.id,
    );

    return buildConsumerKeychain({
      consumerKeychainKeysSQL:
        keysSQLByConsumerKeychainId.get(consumerKeychainId) || [],
      consumerKeychainPurposesSQL:
        purposesSQLByConsumerKeychainId.get(consumerKeychainId) || [],
      consumerKeychainSQL,
      consumerKeychainUsersSQL:
        usersSQLByConsumerKeychainId.get(consumerKeychainId) || [],
    });
  });
};

const createConsumerKeychainSQLPropertyMap = <
  T extends
    | ConsumerKeychainKeySQL
    | ConsumerKeychainPurposeSQL
    | ConsumerKeychainUserSQL,
>(
  items: T[],
): Map<ConsumerKeychainId, T[]> =>
  items.reduce((acc, item) => {
    const consumerKeychainId = unsafeBrandId<ConsumerKeychainId>(
      item.consumerKeychainId,
    );
    const values = acc.get(consumerKeychainId) || [];
    values.push(item);
    acc.set(consumerKeychainId, values);

    return acc;
  }, new Map<ConsumerKeychainId, T[]>());

const toConsumerKeychainAggregator = (
  queryRes: ConsumerKeychainAggregatorInput,
): ConsumerKeychainItemsSQL => {
  const { consumerKeychainsSQL, keysSQL, purposesSQL, usersSQL } =
    toConsumerKeychainsAggregator(queryRes);

  return {
    consumerKeychainKeysSQL: keysSQL,
    consumerKeychainPurposesSQL: purposesSQL,
    consumerKeychainSQL: throwIfMultipleOrEmpty(
      consumerKeychainsSQL,
      "consumerKeychain",
    ),
    consumerKeychainUsersSQL: usersSQL,
  };
};

const toConsumerKeychainsAggregator = (
  queryRes: ConsumerKeychainAggregatorInput,
): {
  consumerKeychainsSQL: ConsumerKeychainSQL[];
  keysSQL: ConsumerKeychainKeySQL[];
  purposesSQL: ConsumerKeychainPurposeSQL[];
  usersSQL: ConsumerKeychainUserSQL[];
} => {
  const consumerKeychainPKSet = new Set<string>();
  const consumerKeychainsSQL: ConsumerKeychainSQL[] = [];

  const keyPKSet = new Set<string>();
  const keysSQL: ConsumerKeychainKeySQL[] = [];

  const purposePKSet = new Set<string>();
  const purposesSQL: ConsumerKeychainPurposeSQL[] = [];

  const userPKSet = new Set<string>();
  const usersSQL: ConsumerKeychainUserSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.consumerKeychain,
      consumerKeychainPKSet,
      consumerKeychainsSQL,
      readmodelConsumerKeychain,
    );
    aggregateByPKString(
      row.key ?? null,
      keyPKSet,
      keysSQL,
      readmodelConsumerKeychainKey,
    );
    aggregateByPKString(
      row.purpose ?? null,
      purposePKSet,
      purposesSQL,
      readmodelConsumerKeychainPurpose,
    );
    aggregateByPKString(
      row.user ?? null,
      userPKSet,
      usersSQL,
      readmodelConsumerKeychainUser,
    );
  });

  return {
    consumerKeychainsSQL,
    keysSQL,
    purposesSQL,
    usersSQL,
  };
};
