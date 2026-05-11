import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type KnodeApiKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  type FlatKnodeApiKeychain,
  type KnodeApiKeychain,
} from "@knodia/keychain-models";

import {
  type KnodeApiKeychainItemsSQL,
  type KnodeApiKeychainKeySQL,
  type KnodeApiKeychainSQL,
  type KnodeApiKeychainUserSQL,
  readmodelKnodeApiKeychain,
  readmodelKnodeApiKeychainKey,
  readmodelKnodeApiKeychainUser,
} from "../knodeApiKeychain.ts";
import {
  buildFlatKnodeApiKeychain,
  buildKnodeApiKeychain,
} from "./knodeApiKeychainConverters.ts";

type KnodeApiKeychainAggregatorInput = {
  key?: KnodeApiKeychainKeySQL | null;
  knodeApiKeychain: KnodeApiKeychainSQL;
  user?: KnodeApiKeychainUserSQL | null;
}[];

export const aggregateFlatKnodeApiKeychain = (
  queryRes: KnodeApiKeychainAggregatorInput,
): undefined | WithMetadata<FlatKnodeApiKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildFlatKnodeApiKeychain(toKnodeApiKeychainAggregator(queryRes));
};

export const aggregateFlatKnodeApiKeychains = (
  queryRes: KnodeApiKeychainAggregatorInput,
): WithMetadata<FlatKnodeApiKeychain>[] => {
  const { knodeApiKeychainsSQL } = toKnodeApiKeychainsAggregator(queryRes);

  return knodeApiKeychainsSQL.map((knodeApiKeychainSQL) =>
    buildFlatKnodeApiKeychain({
      knodeApiKeychainSQL,
    }),
  );
};

export const aggregateKnodeApiKeychain = (
  queryRes: KnodeApiKeychainAggregatorInput,
): undefined | WithMetadata<KnodeApiKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildKnodeApiKeychain(toKnodeApiKeychainAggregator(queryRes));
};

export const aggregateKnodeApiKeychains = (
  queryRes: KnodeApiKeychainAggregatorInput,
): WithMetadata<KnodeApiKeychain>[] => {
  const { keysSQL, knodeApiKeychainsSQL, usersSQL } =
    toKnodeApiKeychainsAggregator(queryRes);

  const keysSQLByKnodeApiKeychainId =
    createKnodeApiKeychainSQLPropertyMap(keysSQL);
  const usersSQLByKnodeApiKeychainId =
    createKnodeApiKeychainSQLPropertyMap(usersSQL);

  return knodeApiKeychainsSQL.map((knodeApiKeychainSQL) => {
    const knodeApiKeychainId = unsafeBrandId<KnodeApiKeychainId>(
      knodeApiKeychainSQL.id,
    );

    return buildKnodeApiKeychain({
      knodeApiKeychainKeysSQL:
        keysSQLByKnodeApiKeychainId.get(knodeApiKeychainId) || [],
      knodeApiKeychainSQL,
      knodeApiKeychainUsersSQL:
        usersSQLByKnodeApiKeychainId.get(knodeApiKeychainId) || [],
    });
  });
};

const createKnodeApiKeychainSQLPropertyMap = <
  T extends KnodeApiKeychainKeySQL | KnodeApiKeychainUserSQL,
>(
  items: T[],
): Map<KnodeApiKeychainId, T[]> =>
  items.reduce((acc, item) => {
    const knodeApiKeychainId = unsafeBrandId<KnodeApiKeychainId>(
      item.knodeApiKeychainId,
    );
    const values = acc.get(knodeApiKeychainId) || [];
    values.push(item);
    acc.set(knodeApiKeychainId, values);

    return acc;
  }, new Map<KnodeApiKeychainId, T[]>());

const toKnodeApiKeychainAggregator = (
  queryRes: KnodeApiKeychainAggregatorInput,
): KnodeApiKeychainItemsSQL => {
  const { keysSQL, knodeApiKeychainsSQL, usersSQL } =
    toKnodeApiKeychainsAggregator(queryRes);

  return {
    knodeApiKeychainKeysSQL: keysSQL,
    knodeApiKeychainSQL: throwIfMultipleOrEmpty(
      knodeApiKeychainsSQL,
      "knodeApiKeychain",
      (k) => k.id,
    ),
    knodeApiKeychainUsersSQL: usersSQL,
  };
};

const toKnodeApiKeychainsAggregator = (
  queryRes: KnodeApiKeychainAggregatorInput,
): {
  keysSQL: KnodeApiKeychainKeySQL[];
  knodeApiKeychainsSQL: KnodeApiKeychainSQL[];
  usersSQL: KnodeApiKeychainUserSQL[];
} => {
  const knodeApiKeychainPKSet = new Set<string>();
  const knodeApiKeychainsSQL: KnodeApiKeychainSQL[] = [];

  const keyPKSet = new Set<string>();
  const keysSQL: KnodeApiKeychainKeySQL[] = [];

  const userPKSet = new Set<string>();
  const usersSQL: KnodeApiKeychainUserSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.knodeApiKeychain,
      knodeApiKeychainPKSet,
      knodeApiKeychainsSQL,
      readmodelKnodeApiKeychain,
    );
    aggregateByPKString(
      row.key,
      keyPKSet,
      keysSQL,
      readmodelKnodeApiKeychainKey,
    );
    aggregateByPKString(
      row.user,
      userPKSet,
      usersSQL,
      readmodelKnodeApiKeychainUser,
    );
  });

  return {
    keysSQL,
    knodeApiKeychainsSQL,
    usersSQL,
  };
};
