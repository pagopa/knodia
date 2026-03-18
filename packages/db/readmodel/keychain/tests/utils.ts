import type { splitConsumerKeychainIntoObjectsSQL } from "../src/converters/splitters.ts";

export function createConsumerKeychainAggregatorInput({
  consumerKeychainKeysSQL,
  consumerKeychainPurposesSQL,
  consumerKeychainSQL,
  consumerKeychainUsersSQL,
}: ReturnType<typeof splitConsumerKeychainIntoObjectsSQL>) {
  const keysOrNull = consumerKeychainKeysSQL.length
    ? consumerKeychainKeysSQL
    : [null];
  const purposesOrNull = consumerKeychainPurposesSQL.length
    ? consumerKeychainPurposesSQL
    : [null];
  const usersOrNull = consumerKeychainUsersSQL.length
    ? consumerKeychainUsersSQL
    : [null];

  return keysOrNull.flatMap((keySQL) =>
    purposesOrNull.flatMap((purposeSQL) =>
      usersOrNull.map((userSQL) => ({
        consumerKeychain: consumerKeychainSQL,
        key: keySQL,
        purpose: purposeSQL,
        user: userSQL,
      })),
    ),
  );
}
