import { unsafeBrandKeyId, unsafeBrandUserId } from "@knodia/common-models/ids";
import {
  KeyAlgorithm,
  type KeychainKey,
  type KeychainUser,
  KeyFormat,
  LocalizedName,
} from "@knodia/keychain-models";

import type {
  ConsumerKeychainKeySQL,
  ConsumerKeychainUserSQL,
} from "../consumerKeychain.ts";
import type {
  KnodeApiKeychainKeySQL,
  KnodeApiKeychainUserSQL,
} from "../knodeApiKeychain.ts";

export function toKeychainKey(
  keySQL: ConsumerKeychainKeySQL | KnodeApiKeychainKeySQL,
): KeychainKey {
  return {
    algorithm: KeyAlgorithm.parse(keySQL.algorithm),
    createdAt: keySQL.createdAt,
    encodedPem: keySQL.encodedPem,
    format: KeyFormat.parse(keySQL.format),
    kid: unsafeBrandKeyId(keySQL.kid),
    name: LocalizedName.parse(keySQL.name),
    userId: unsafeBrandUserId(keySQL.userId),
  };
}

export function toKeychainUser(
  userSQL: ConsumerKeychainUserSQL | KnodeApiKeychainUserSQL,
): KeychainUser {
  return {
    addedAt: userSQL.addedAt,
    userId: unsafeBrandUserId(userSQL.userId),
  };
}
