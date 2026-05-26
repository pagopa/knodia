import type {
  ConsumerKeychain,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";

import type { splitConsumerKeychainIntoObjectsSQL } from "../src/converters/consumerKeychainSplitters.ts";

export function createConsumerKeychainAggregatorInput({
  consumerKeychainKeysSQL,
  consumerKeychainSQL,
  consumerKeychainUsersSQL,
}: ReturnType<typeof splitConsumerKeychainIntoObjectsSQL>) {
  const keysOrNull = consumerKeychainKeysSQL.length
    ? consumerKeychainKeysSQL
    : [null];
  const usersOrNull = consumerKeychainUsersSQL.length
    ? consumerKeychainUsersSQL
    : [null];

  return keysOrNull.flatMap((keySQL) =>
    usersOrNull.map((userSQL) => ({
      consumerKeychain: consumerKeychainSQL,
      key: keySQL,
      user: userSQL,
    })),
  );
}

export function toFlatConsumerKeychain(
  consumerKeychain: ConsumerKeychain,
): FlatConsumerKeychain {
  return {
    createdAt: consumerKeychain.createdAt,
    description: consumerKeychain.description,
    id: consumerKeychain.id,
    name: consumerKeychain.name,
    ownerId: consumerKeychain.ownerId,
    updatedAt: consumerKeychain.updatedAt,
  };
}
