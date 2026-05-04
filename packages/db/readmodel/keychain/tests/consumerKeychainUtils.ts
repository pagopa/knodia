import type { splitConsumerKeychainIntoObjectsSQL } from "../src/converters/splitters.ts";

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
