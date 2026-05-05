import type { splitKnodeApiKeychainIntoObjectsSQL } from "../src/converters/knodeApiKeychainSplitters.ts";

export function createKnodeApiKeychainAggregatorInput({
  knodeApiKeychainKeysSQL,
  knodeApiKeychainSQL,
  knodeApiKeychainUsersSQL,
}: ReturnType<typeof splitKnodeApiKeychainIntoObjectsSQL>) {
  const keysOrNull = knodeApiKeychainKeysSQL.length
    ? knodeApiKeychainKeysSQL
    : [null];
  const usersOrNull = knodeApiKeychainUsersSQL.length
    ? knodeApiKeychainUsersSQL
    : [null];

  return keysOrNull.flatMap((keySQL) =>
    usersOrNull.map((userSQL) => ({
      key: keySQL,
      knodeApiKeychain: knodeApiKeychainSQL,
      user: userSQL,
    })),
  );
}
