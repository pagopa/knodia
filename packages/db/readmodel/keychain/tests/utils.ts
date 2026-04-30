import type { splitKnodiaApiKeychainIntoObjectsSQL } from "../src/converters/knodiaApiKeychainSplitters.ts";
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

export function createKnodiaApiKeychainAggregatorInput({
  knodiaApiKeychainKeysSQL,
  knodiaApiKeychainSQL,
  knodiaApiKeychainUsersSQL,
}: ReturnType<typeof splitKnodiaApiKeychainIntoObjectsSQL>) {
  const keysOrNull = knodiaApiKeychainKeysSQL.length
    ? knodiaApiKeychainKeysSQL
    : [null];
  const usersOrNull = knodiaApiKeychainUsersSQL.length
    ? knodiaApiKeychainUsersSQL
    : [null];

  return keysOrNull.flatMap((keySQL) =>
    usersOrNull.map((userSQL) => ({
      key: keySQL,
      knodiaApiKeychain: knodiaApiKeychainSQL,
      user: userSQL,
    })),
  );
}
