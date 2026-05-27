import type { CognitoIdmClient } from "@knodia/cognito-idm-client";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type {
  ConsumerKeychain,
  KeychainKey,
  KnodeApiKeychain,
  ProducerKeychain,
} from "@knodia/keychain-models";

import { InternalError } from "@knodia/common-models/errors";
import {
  type KeyId,
  unsafeBrandKeyId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { calculateKid, createJWK, decodeBase64Pem } from "@knodia/crypto";
import { match, P } from "ts-pattern";

import type {
  API_KeychainKeySeed,
  API_KeychainMemberSeed,
  API_KeychainPatch,
} from "../models/api.ts";
import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  jwkDecodingError,
  userAlreadyMember,
  userNotFound,
} from "../models/errors.ts";
import { retrieveKeychainKey } from "./retrievalUtils.ts";
import {
  assertKeychainKeysCountIsBelowThreshold,
  assertKeyIsUnique,
  assertNotX509Certificate,
  assertOrganizationIsKeychainOwner,
  assertUserBelongsToOrganization,
  assertUserHasTechnicalRole,
  assertUserIsAllowedToPerformKeychainOperation,
  assertUserIsAllowedToRemoveKey,
  assertUserIsMemberOfKeychain,
} from "./validators.ts";

export async function addKeyToKeychain<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>(
  keychain: K,
  authData: UISessionAuthData,
  keySeed: API_KeychainKeySeed,
  readmodelService: ReadmodelService,
  maxKeysPerKeychain: number,
): Promise<{
  newKey: KeychainKey;
  updatedKeychain: K;
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

export async function addMemberToKeychain<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>(
  keychain: K,
  member: API_KeychainMemberSeed,
  authData: UISessionAuthData,
  cognitoIdmClient: CognitoIdmClient,
): Promise<{
  addedUserId: UserId;
  updatedKeychain: K;
}> {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);

  const userId = unsafeBrandUserId(member.userId);

  if (keychain.users.some((u) => u.userId === userId)) {
    throw userAlreadyMember(keychain.id, userId);
  }

  const user = await cognitoIdmClient.getUserById(userId);

  if (!user) {
    throw userNotFound(userId);
  }

  await assertUserBelongsToOrganization(
    user,
    authData.organizationId,
    cognitoIdmClient,
  );
  assertUserHasTechnicalRole(user);

  const now = new Date();
  return {
    addedUserId: user.id,
    updatedKeychain: {
      ...keychain,
      updatedAt: now,
      users: [...keychain.users, { addedAt: now, userId: user.id }],
    },
  };
}

export function removeKeyFromKeychain<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>(keychain: K, authData: UISessionAuthData, kid: KeyId): K {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);
  assertUserIsAllowedToRemoveKey(authData, keychain.id, keychain.users);
  retrieveKeychainKey(keychain, kid);

  return {
    ...keychain,
    keys: keychain.keys.filter((key) => key.kid !== kid),
    updatedAt: new Date(),
  };
}

export function removeMemberFromKeychain<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>(
  keychain: K,
  userId: UserId,
  authData: UISessionAuthData,
): { updatedKeychain: K } {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);

  assertUserIsMemberOfKeychain(userId, keychain.id, keychain.users);

  return {
    updatedKeychain: {
      ...keychain,
      updatedAt: new Date(),
      users: keychain.users.filter((member) => member.userId !== userId),
    },
  };
}

export function updateKeychain<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>(
  keychain: K,
  update: API_KeychainPatch | API_KeychainPatch | API_KeychainPatch,
  authData: UISessionAuthData,
): K {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);

  return {
    ...keychain,
    description: match(update.description)
      .with(null, () => undefined)
      .with(undefined, () => keychain.description)
      .with(P.nonNullable, (desc) => desc)
      .exhaustive(),
    name: update.name ?? keychain.name,
    updatedAt: new Date(),
  };
}
