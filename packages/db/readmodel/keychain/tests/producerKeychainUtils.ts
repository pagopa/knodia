import type {
  FlatProducerKeychain,
  ProducerKeychain,
} from "@knodia/keychain-models";

import type { splitProducerKeychainIntoObjectsSQL } from "../src/converters/producerKeychainSplitters.ts";

export function createProducerKeychainAggregatorInput({
  producerKeychainKeysSQL,
  producerKeychainSQL,
  producerKeychainUsersSQL,
}: ReturnType<typeof splitProducerKeychainIntoObjectsSQL>) {
  const keysOrNull = producerKeychainKeysSQL.length
    ? producerKeychainKeysSQL
    : [null];
  const usersOrNull = producerKeychainUsersSQL.length
    ? producerKeychainUsersSQL
    : [null];

  return keysOrNull.flatMap((keySQL) =>
    usersOrNull.map((userSQL) => ({
      key: keySQL,
      producerKeychain: producerKeychainSQL,
      user: userSQL,
    })),
  );
}

export function toFlatProducerKeychain(
  producerKeychain: ProducerKeychain,
): FlatProducerKeychain {
  return {
    createdAt: producerKeychain.createdAt,
    description: producerKeychain.description,
    id: producerKeychain.id,
    name: producerKeychain.name,
    ownerId: producerKeychain.ownerId,
    updatedAt: producerKeychain.updatedAt,
  };
}
