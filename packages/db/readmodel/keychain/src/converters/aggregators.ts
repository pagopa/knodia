import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type ConsumerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  type ConsumerKeychain,
  type FlatConsumerKeychain,
} from "@knodia/keychain-models";

import {
  type ConsumerKeychainItemsSQL,
  type ConsumerKeychainKeySQL,
  type ConsumerKeychainSQL,
  type ConsumerKeychainUserSQL,
  readmodelConsumerKeychain,
  readmodelConsumerKeychainKey,
  readmodelConsumerKeychainUser,
} from "../consumerKeychain.ts";
import {
  buildConsumerKeychain,
  buildFlatConsumerKeychain,
} from "./converters.ts";

type ConsumerKeychainAggregatorInput = {
  consumerKeychain: ConsumerKeychainSQL;
  key?: ConsumerKeychainKeySQL | null;
  user?: ConsumerKeychainUserSQL | null;
}[];

export const aggregateConsumerKeychain = (
  queryRes: ConsumerKeychainAggregatorInput,
): undefined | WithMetadata<ConsumerKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildConsumerKeychain(toConsumerKeychainAggregator(queryRes));
};

export const aggregateFlatConsumerKeychain = (
  queryRes: ConsumerKeychainAggregatorInput,
): undefined | WithMetadata<FlatConsumerKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildFlatConsumerKeychain(toConsumerKeychainAggregator(queryRes));
};

export const aggregateFlatConsumerKeychains = (
  queryRes: ConsumerKeychainAggregatorInput,
): WithMetadata<FlatConsumerKeychain>[] => {
  const { consumerKeychainsSQL } = toConsumerKeychainsAggregator(queryRes);

  return consumerKeychainsSQL.map((consumerKeychainSQL) =>
    buildFlatConsumerKeychain({
      consumerKeychainSQL,
    }),
  );
};

export const aggregateConsumerKeychains = (
  queryRes: ConsumerKeychainAggregatorInput,
): WithMetadata<ConsumerKeychain>[] => {
  const { consumerKeychainsSQL, keysSQL, usersSQL } =
    toConsumerKeychainsAggregator(queryRes);

  const keysSQLByConsumerKeychainId =
    createConsumerKeychainSQLPropertyMap(keysSQL);
  const usersSQLByConsumerKeychainId =
    createConsumerKeychainSQLPropertyMap(usersSQL);

  return consumerKeychainsSQL.map((consumerKeychainSQL) => {
    const consumerKeychainId = unsafeBrandId<ConsumerKeychainId>(
      consumerKeychainSQL.id,
    );

    return buildConsumerKeychain({
      consumerKeychainKeysSQL:
        keysSQLByConsumerKeychainId.get(consumerKeychainId) || [],
      consumerKeychainSQL,
      consumerKeychainUsersSQL:
        usersSQLByConsumerKeychainId.get(consumerKeychainId) || [],
    });
  });
};

const createConsumerKeychainSQLPropertyMap = <
  T extends ConsumerKeychainKeySQL | ConsumerKeychainUserSQL,
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
  const { consumerKeychainsSQL, keysSQL, usersSQL } =
    toConsumerKeychainsAggregator(queryRes);

  return {
    consumerKeychainKeysSQL: keysSQL,
    consumerKeychainSQL: throwIfMultipleOrEmpty(
      consumerKeychainsSQL,
      "consumerKeychain",
      (ck) => ck.id,
    ),
    consumerKeychainUsersSQL: usersSQL,
  };
};

const toConsumerKeychainsAggregator = (
  queryRes: ConsumerKeychainAggregatorInput,
): {
  consumerKeychainsSQL: ConsumerKeychainSQL[];
  keysSQL: ConsumerKeychainKeySQL[];
  usersSQL: ConsumerKeychainUserSQL[];
} => {
  const consumerKeychainPKSet = new Set<string>();
  const consumerKeychainsSQL: ConsumerKeychainSQL[] = [];

  const keyPKSet = new Set<string>();
  const keysSQL: ConsumerKeychainKeySQL[] = [];

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
      row.key,
      keyPKSet,
      keysSQL,
      readmodelConsumerKeychainKey,
    );
    aggregateByPKString(
      row.user,
      userPKSet,
      usersSQL,
      readmodelConsumerKeychainUser,
    );
  });

  return {
    consumerKeychainsSQL,
    keysSQL,
    usersSQL,
  };
};
