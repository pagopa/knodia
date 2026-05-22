import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type ProducerKeychainId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  aggregateByPKString,
  throwIfMultipleOrEmpty,
} from "@knodia/db-readmodel-commons/utils";
import {
  type FlatProducerKeychain,
  type ProducerKeychain,
} from "@knodia/keychain-models";

import {
  type ProducerKeychainItemsSQL,
  type ProducerKeychainKeySQL,
  type ProducerKeychainSQL,
  type ProducerKeychainUserSQL,
  readmodelProducerKeychain,
  readmodelProducerKeychainKey,
  readmodelProducerKeychainUser,
} from "../producerKeychain.ts";
import {
  buildFlatProducerKeychain,
  buildProducerKeychain,
} from "./producerKeychainConverters.ts";

type ProducerKeychainAggregatorInput = {
  key?: null | ProducerKeychainKeySQL;
  producerKeychain: ProducerKeychainSQL;
  user?: null | ProducerKeychainUserSQL;
}[];

export const aggregateProducerKeychain = (
  queryRes: ProducerKeychainAggregatorInput,
): undefined | WithMetadata<ProducerKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildProducerKeychain(toProducerKeychainAggregator(queryRes));
};

export const aggregateFlatProducerKeychain = (
  queryRes: ProducerKeychainAggregatorInput,
): undefined | WithMetadata<FlatProducerKeychain> => {
  if (queryRes.length === 0) {
    return undefined;
  }

  return buildFlatProducerKeychain(toProducerKeychainAggregator(queryRes));
};

export const aggregateFlatProducerKeychains = (
  queryRes: ProducerKeychainAggregatorInput,
): WithMetadata<FlatProducerKeychain>[] => {
  const { producerKeychainsSQL } = toProducerKeychainsAggregator(queryRes);

  return producerKeychainsSQL.map((producerKeychainSQL) =>
    buildFlatProducerKeychain({
      producerKeychainSQL,
    }),
  );
};

export const aggregateProducerKeychains = (
  queryRes: ProducerKeychainAggregatorInput,
): WithMetadata<ProducerKeychain>[] => {
  const { keysSQL, producerKeychainsSQL, usersSQL } =
    toProducerKeychainsAggregator(queryRes);

  const keysSQLByProducerKeychainId =
    createProducerKeychainSQLPropertyMap(keysSQL);
  const usersSQLByProducerKeychainId =
    createProducerKeychainSQLPropertyMap(usersSQL);

  return producerKeychainsSQL.map((producerKeychainSQL) => {
    const producerKeychainId = unsafeBrandId<ProducerKeychainId>(
      producerKeychainSQL.id,
    );

    return buildProducerKeychain({
      producerKeychainKeysSQL:
        keysSQLByProducerKeychainId.get(producerKeychainId) || [],
      producerKeychainSQL,
      producerKeychainUsersSQL:
        usersSQLByProducerKeychainId.get(producerKeychainId) || [],
    });
  });
};

const createProducerKeychainSQLPropertyMap = <
  T extends ProducerKeychainKeySQL | ProducerKeychainUserSQL,
>(
  items: T[],
): Map<ProducerKeychainId, T[]> =>
  items.reduce((acc, item) => {
    const producerKeychainId = unsafeBrandId<ProducerKeychainId>(
      item.producerKeychainId,
    );
    const values = acc.get(producerKeychainId) || [];
    values.push(item);
    acc.set(producerKeychainId, values);

    return acc;
  }, new Map<ProducerKeychainId, T[]>());

const toProducerKeychainAggregator = (
  queryRes: ProducerKeychainAggregatorInput,
): ProducerKeychainItemsSQL => {
  const { keysSQL, producerKeychainsSQL, usersSQL } =
    toProducerKeychainsAggregator(queryRes);

  return {
    producerKeychainKeysSQL: keysSQL,
    producerKeychainSQL: throwIfMultipleOrEmpty(
      producerKeychainsSQL,
      "producerKeychain",
      (ck) => ck.id,
    ),
    producerKeychainUsersSQL: usersSQL,
  };
};

const toProducerKeychainsAggregator = (
  queryRes: ProducerKeychainAggregatorInput,
): {
  keysSQL: ProducerKeychainKeySQL[];
  producerKeychainsSQL: ProducerKeychainSQL[];
  usersSQL: ProducerKeychainUserSQL[];
} => {
  const producerKeychainPKSet = new Set<string>();
  const producerKeychainsSQL: ProducerKeychainSQL[] = [];

  const keyPKSet = new Set<string>();
  const keysSQL: ProducerKeychainKeySQL[] = [];

  const userPKSet = new Set<string>();
  const usersSQL: ProducerKeychainUserSQL[] = [];

  queryRes.forEach((row) => {
    aggregateByPKString(
      row.producerKeychain,
      producerKeychainPKSet,
      producerKeychainsSQL,
      readmodelProducerKeychain,
    );
    aggregateByPKString(
      row.key,
      keyPKSet,
      keysSQL,
      readmodelProducerKeychainKey,
    );
    aggregateByPKString(
      row.user,
      userPKSet,
      usersSQL,
      readmodelProducerKeychainUser,
    );
  });

  return {
    keysSQL,
    producerKeychainsSQL,
    usersSQL,
  };
};
