import type {
  FlatKnodeApiKeychain,
  KnodeApiKeychain,
} from "@knodia/keychain-models";

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

export function toFlatKnodeApiKeychain(
  knodeApiKeychain: KnodeApiKeychain,
): FlatKnodeApiKeychain {
  return {
    createdAt: knodeApiKeychain.createdAt,
    description: knodeApiKeychain.description,
    id: knodeApiKeychain.id,
    name: knodeApiKeychain.name,
    ownerId: knodeApiKeychain.ownerId,
    updatedAt: knodeApiKeychain.updatedAt,
  };
}
