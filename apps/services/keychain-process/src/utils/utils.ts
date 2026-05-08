import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type {
  ConsumerKeychain,
  KeychainKey,
  KnodeApiKeychain,
} from "@knodia/keychain-models";

import { InternalError } from "@knodia/common-models/errors";
import { unsafeBrandKeyId } from "@knodia/common-models/ids";
import { calculateKid, createJWK, decodeBase64Pem } from "@knodia/crypto";

import type { API_KeychainKeySeed } from "../models/api.ts";
import type { ReadmodelService } from "../services/readmodelService.ts";

import { jwkDecodingError } from "../models/errors.ts";
import {
  assertKeychainKeysCountIsBelowThreshold,
  assertKeyIsUnique,
  assertNotX509Certificate,
  assertOrganizationIsKeychainOwner,
  assertUserIsAllowedToPerformKeychainOperation,
} from "./validators.ts";

export async function addKeyToKeychain(
  keychain: ConsumerKeychain,
  authData: UISessionAuthData,
  keySeed: API_KeychainKeySeed,
  readmodelService: ReadmodelService,
  maxKeysPerKeychain: number,
): Promise<{
  newKey: KeychainKey;
  updatedKeychain: ConsumerKeychain;
}>;
export async function addKeyToKeychain(
  keychain: KnodeApiKeychain,
  authData: UISessionAuthData,
  keySeed: API_KeychainKeySeed,
  readmodelService: ReadmodelService,
  maxKeysPerKeychain: number,
): Promise<{
  newKey: KeychainKey;
  updatedKeychain: KnodeApiKeychain;
}>;
export async function addKeyToKeychain(
  keychain: ConsumerKeychain | KnodeApiKeychain,
  authData: UISessionAuthData,
  keySeed: API_KeychainKeySeed,
  readmodelService: ReadmodelService,
  maxKeysPerKeychain: number,
): Promise<{
  newKey: KeychainKey;
  updatedKeychain: ConsumerKeychain | KnodeApiKeychain;
}> {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);

  assertUserIsAllowedToPerformKeychainOperation(
    authData.userId,
    keychain.id,
    keychain.users,
  );

  assertKeychainKeysCountIsBelowThreshold(
    keychain.id,
    maxKeysPerKeychain,
    keychain.keys.length + 1,
  );

  const pemKey = decodeBase64Pem(keySeed.encodedPem);

  assertNotX509Certificate(pemKey);

  let jwk: JsonWebKey;
  try {
    jwk = createJWK({ pemKey });
  } catch (error) {
    if (error instanceof InternalError) {
      throw jwkDecodingError(error.message);
    }
    throw error;
  }

  const kid = unsafeBrandKeyId(calculateKid(jwk));

  await assertKeyIsUnique(kid, keychain.keys, readmodelService);

  const newKey: KeychainKey = {
    algorithm: "RS256",
    createdAt: new Date(),
    encodedPem: keySeed.encodedPem,
    format: "PublicKey",
    kid,
    name: keySeed.name,
    userId: authData.userId,
  };

  return {
    newKey,
    updatedKeychain: {
      ...keychain,
      keys: [...keychain.keys, newKey],
      updatedAt: new Date(),
    },
  };
}
