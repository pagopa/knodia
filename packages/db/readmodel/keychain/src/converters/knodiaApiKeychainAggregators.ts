import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type KnodiaApiKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  type FlatKnodiaApiKeychain,
  type KnodiaApiKeychain,
} from "@knodia/keychain-models";

import {
  type KnodiaApiKeychainItemsSQL,
  type KnodiaApiKeychainKeySQL,
  type KnodiaApiKeychainSQL,
  type KnodiaApiKeychainUserSQL,
  readmodelKnodiaApiKeychain,
  readmodelKnodiaApiKeychainKey,
  readmodelKnodiaApiKeychainUser,
} from "../knodiaApiKeychain.ts";
import {
  buildFlatKnodiaApiKeychain,
  buildKnodiaApiKeychain,
} from "./knodiaApiKeychainConverters.ts";

type KnodiaApiKeychainAggregatorInput = {
  key?: KnodiaApiKeychainKeySQL | null;
  knodiaApiKeychain: KnodiaApiKeychainSQL;
  user?: KnodiaApiKeychainUserSQL | null;
}[];

export const aggregateKnodiaApiKeychain = (
  queryRes: KnodiaApiKeychainAggregatorInput,
): undefined | WithMetadata<KnodiaApiKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildKnodiaApiKeychain(toKnodiaApiKeychainAggregator(queryRes));
};

export const aggregateFlatKnodiaApiKeychain = (
  queryRes: KnodiaApiKeychainAggregatorInput,
): undefined | WithMetadata<FlatKnodiaApiKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildFlatKnodiaApiKeychain(toKnodiaApiKeychainAggregator(queryRes));
};

export const aggregateFlatKnodiaApiKeychains = (
  queryRes: KnodiaApiKeychainAggregatorInput,
): WithMetadata<FlatKnodiaApiKeychain>[] => {
  const { knodiaApiKeychainsSQL } = toKnodiaApiKeychainsAggregator(queryRes);

  return knodiaApiKeychainsSQL.map((knodiaApiKeychainSQL) =>
    buildFlatKnodiaApiKeychain({
      knodiaApiKeychainSQL,
    }),
  );
};

export const aggregateKnodiaApiKeychains = (
  queryRes: KnodiaApiKeychainAggregatorInput,
): WithMetadata<KnodiaApiKeychain>[] => {
  const { keysSQL, knodiaApiKeychainsSQL, usersSQL } =
    toKnodiaApiKeychainsAggregator(queryRes);

  const keysSQLByKeychainId = createKnodiaApiKeychainSQLPropertyMap(keysSQL);
  const usersSQLByKeychainId = createKnodiaApiKeychainSQLPropertyMap(usersSQL);

  return knodiaApiKeychainsSQL.map((knodiaApiKeychainSQL) => {
    const knodiaApiKeychainId = unsafeBrandId<KnodiaApiKeychainId>(
      knodiaApiKeychainSQL.id,
    );

    return buildKnodiaApiKeychain({
      knodiaApiKeychainKeysSQL:
        keysSQLByKeychainId.get(knodiaApiKeychainId) || [],
      knodiaApiKeychainSQL,
      knodiaApiKeychainUsersSQL:
        usersSQLByKeychainId.get(knodiaApiKeychainId) || [],
    });
  });
};

const createKnodiaApiKeychainSQLPropertyMap = <
  T extends KnodiaApiKeychainKeySQL | KnodiaApiKeychainUserSQL,
>(
  items: T[],
): Map<KnodiaApiKeychainId, T[]> =>
  items.reduce((acc, item) => {
    const knodiaApiKeychainId = unsafeBrandId<KnodiaApiKeychainId>(
      item.knodiaApiKeychainId,
    );
    const values = acc.get(knodiaApiKeychainId) || [];
    values.push(item);
    acc.set(knodiaApiKeychainId, values);

    return acc;
  }, new Map<KnodiaApiKeychainId, T[]>());

const toKnodiaApiKeychainAggregator = (
  queryRes: KnodiaApiKeychainAggregatorInput,
): KnodiaApiKeychainItemsSQL => {
  const { keysSQL, knodiaApiKeychainsSQL, usersSQL } =
    toKnodiaApiKeychainsAggregator(queryRes);

  return {
    knodiaApiKeychainKeysSQL: keysSQL,
    knodiaApiKeychainSQL: throwIfMultipleOrEmpty(
      knodiaApiKeychainsSQL,
      "knodiaApiKeychain",
      (k) => k.id,
    ),
    knodiaApiKeychainUsersSQL: usersSQL,
  };
};

const toKnodiaApiKeychainsAggregator = (
  queryRes: KnodiaApiKeychainAggregatorInput,
): {
  keysSQL: KnodiaApiKeychainKeySQL[];
  knodiaApiKeychainsSQL: KnodiaApiKeychainSQL[];
  usersSQL: KnodiaApiKeychainUserSQL[];
} => {
  const knodiaApiKeychainPKSet = new Set<string>();
  const knodiaApiKeychainsSQL: KnodiaApiKeychainSQL[] = [];

  const keyPKSet = new Set<string>();
  const keysSQL: KnodiaApiKeychainKeySQL[] = [];

  const userPKSet = new Set<string>();
  const usersSQL: KnodiaApiKeychainUserSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.knodiaApiKeychain,
      knodiaApiKeychainPKSet,
      knodiaApiKeychainsSQL,
      readmodelKnodiaApiKeychain,
    );
    aggregateByPKString(
      row.key,
      keyPKSet,
      keysSQL,
      readmodelKnodiaApiKeychainKey,
    );
    aggregateByPKString(
      row.user,
      userPKSet,
      usersSQL,
      readmodelKnodiaApiKeychainUser,
    );
  });

  return {
    keysSQL,
    knodiaApiKeychainsSQL,
    usersSQL,
  };
};
