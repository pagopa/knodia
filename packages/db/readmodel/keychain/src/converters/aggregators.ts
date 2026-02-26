import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type KeychainId,
  OrganizationId,
  type PurposeId,
  unsafeBrandId,
  type UserId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  Keychain,
  KeychainKey,
  KeychainKind,
  KeyFormat,
  KeyUse,
  LocalizedDescription,
  LocalizedName,
} from "@knodia/keychain-models";

import {
  type KeychainItemsSQL,
  type KeychainKeySQL,
  type KeychainPurposeSQL,
  type KeychainSQL,
  type KeychainUserSQL,
  readmodelKeychain,
  readmodelKeychainKey,
  readmodelKeychainPurpose,
  readmodelKeychainUser,
} from "../keychain.ts";

type KeychainAggregatorInput = {
  key?: KeychainKeySQL | null;
  keychain: KeychainSQL;
  purpose?: KeychainPurposeSQL | null;
  user?: KeychainUserSQL | null;
}[];

const buildKeychain = ({
  keychainKeysSQL,
  keychainPurposesSQL,
  keychainSQL,
  keychainUsersSQL,
}: KeychainItemsSQL): WithMetadata<Keychain> => {
  const keychain: Keychain = {
    createdAt: new Date(keychainSQL.createdAt),
    description:
      keychainSQL.description == null
        ? undefined
        : LocalizedDescription.parse(keychainSQL.description),
    id: unsafeBrandId(keychainSQL.id),
    keys: keychainKeysSQL.map(buildKeychainKey),
    kind: KeychainKind.parse(keychainSQL.kind),
    name: LocalizedName.parse(keychainSQL.name),
    ownerId: unsafeBrandId<OrganizationId>(keychainSQL.ownerId),
    purposes: keychainPurposesSQL.map((purposeSQL) =>
      unsafeBrandId<PurposeId>(purposeSQL.purposeId),
    ),
    updatedAt: new Date(keychainSQL.updatedAt),
    users: keychainUsersSQL.map((userSQL) =>
      unsafeBrandId<UserId>(userSQL.userId),
    ),
  };

  return {
    data: keychain,
    metadata: { version: keychainSQL.metadataVersion },
  };
};

function buildKeychainKey(keySQL: KeychainKeySQL): KeychainKey {
  return {
    algorithm: keySQL.algorithm,
    createdAt: new Date(keySQL.createdAt),
    encodedPem: keySQL.encodedPem,
    format: KeyFormat.parse(keySQL.format),
    kid: keySQL.kid,
    name: LocalizedName.parse(keySQL.name),
    use: KeyUse.parse(keySQL.use),
    userId: unsafeBrandId<UserId>(keySQL.userId),
  };
}

export const aggregateKeychain = (
  queryRes: KeychainAggregatorInput,
): undefined | WithMetadata<Keychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildKeychain(toKeychainAggregator(queryRes));
};

export const aggregateKeychains = (
  queryRes: KeychainAggregatorInput,
): WithMetadata<Keychain>[] => {
  const { keychainsSQL, keysSQL, purposesSQL, usersSQL } =
    toKeychainsAggregator(queryRes);

  const keysSQLByKeychainId = createKeychainSQLPropertyMap(keysSQL);
  const purposesSQLByKeychainId = createKeychainSQLPropertyMap(purposesSQL);
  const usersSQLByKeychainId = createKeychainSQLPropertyMap(usersSQL);

  return keychainsSQL.map((keychainSQL) => {
    const keychainId = unsafeBrandId<KeychainId>(keychainSQL.id);

    return buildKeychain({
      keychainKeysSQL: keysSQLByKeychainId.get(keychainId) || [],
      keychainPurposesSQL: purposesSQLByKeychainId.get(keychainId) || [],
      keychainSQL,
      keychainUsersSQL: usersSQLByKeychainId.get(keychainId) || [],
    });
  });
};

const createKeychainSQLPropertyMap = <
  T extends KeychainKeySQL | KeychainPurposeSQL | KeychainUserSQL,
>(
  items: T[],
): Map<KeychainId, T[]> =>
  items.reduce((acc, item) => {
    const keychainId = unsafeBrandId<KeychainId>(item.keychainId);
    const values = acc.get(keychainId) || [];
    values.push(item);
    acc.set(keychainId, values);

    return acc;
  }, new Map<KeychainId, T[]>());

const toKeychainAggregator = (
  queryRes: KeychainAggregatorInput,
): KeychainItemsSQL => {
  const { keychainsSQL, keysSQL, purposesSQL, usersSQL } =
    toKeychainsAggregator(queryRes);

  return {
    keychainKeysSQL: keysSQL,
    keychainPurposesSQL: purposesSQL,
    keychainSQL: throwIfMultipleOrEmpty(keychainsSQL, "keychain"),
    keychainUsersSQL: usersSQL,
  };
};

const toKeychainsAggregator = (
  queryRes: KeychainAggregatorInput,
): {
  keychainsSQL: KeychainSQL[];
  keysSQL: KeychainKeySQL[];
  purposesSQL: KeychainPurposeSQL[];
  usersSQL: KeychainUserSQL[];
} => {
  const keychainPKSet = new Set<string>();
  const keychainsSQL: KeychainSQL[] = [];

  const keyPKSet = new Set<string>();
  const keysSQL: KeychainKeySQL[] = [];

  const purposePKSet = new Set<string>();
  const purposesSQL: KeychainPurposeSQL[] = [];

  const userPKSet = new Set<string>();
  const usersSQL: KeychainUserSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.keychain,
      keychainPKSet,
      keychainsSQL,
      readmodelKeychain,
    );
    aggregateByPKString(
      row.key ?? null,
      keyPKSet,
      keysSQL,
      readmodelKeychainKey,
    );
    aggregateByPKString(
      row.purpose ?? null,
      purposePKSet,
      purposesSQL,
      readmodelKeychainPurpose,
    );
    aggregateByPKString(
      row.user ?? null,
      userPKSet,
      usersSQL,
      readmodelKeychainUser,
    );
  });

  return {
    keychainsSQL,
    keysSQL,
    purposesSQL,
    usersSQL,
  };
};
