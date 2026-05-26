import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type {
  ConsumerKeychainId,
  KeyId,
  KnodeApiKeychainId,
  ProducerKeychainId,
  UserId,
} from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  KeychainUser,
  KnodeApiKeychain,
  ProducerKeychain,
} from "@knodia/keychain-models";

import { genericInternalError } from "@knodia/common-models/errors";

import type { API_GetProducerKeychainMembersQueryParams } from "../models/api.ts";
import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  keyNotFoundInKeychain,
  knodeApiKeychainNotFound,
  producerKeychainNotFound,
} from "../models/errors.ts";
import {
  assertOrganizationIsKeychainOwner,
  assertUserIsMemberOfKeychain,
} from "./validators.ts";

type KeychainKind =
  | "Consumer Keychain"
  | "Knode API Keychain"
  | "Producer Keychain";

export const retrieveConsumerKeychain = async (
  consumerKeychainId: ConsumerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychain =
    await readmodelService.getConsumerKeychainById(consumerKeychainId);

  if (!consumerKeychain) {
    throw consumerKeychainNotFound(consumerKeychainId);
  }

  return consumerKeychain;
};

export const retrieveFlatConsumerKeychain = async (
  consumerKeychainId: ConsumerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychain =
    await readmodelService.getFlatConsumerKeychainById(consumerKeychainId);

  if (!consumerKeychain) {
    throw consumerKeychainNotFound(consumerKeychainId);
  }

  return consumerKeychain;
};

export const retrieveFlatKnodeApiKeychain = async (
  knodeApiKeychainId: KnodeApiKeychainId,
  readmodelService: ReadmodelService,
) => {
  const knodeApiKeychain =
    await readmodelService.getFlatKnodeApiKeychainById(knodeApiKeychainId);

  if (!knodeApiKeychain) {
    throw knodeApiKeychainNotFound(knodeApiKeychainId);
  }

  return knodeApiKeychain;
};

export const retrieveKnodeApiKeychain = async (
  knodeApiKeychainId: KnodeApiKeychainId,
  readmodelService: ReadmodelService,
) => {
  const knodeApiKeychain =
    await readmodelService.getKnodeApiKeychainById(knodeApiKeychainId);

  if (!knodeApiKeychain) {
    throw knodeApiKeychainNotFound(knodeApiKeychainId);
  }

  return knodeApiKeychain;
};

export const retrieveConsumerKeychainPurpose = async (
  consumerKeychainPurpose: Omit<ConsumerKeychainPurpose, "linkedAt">,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychainPurposeResult =
    await readmodelService.getConsumerKeychainPurpose(consumerKeychainPurpose);

  if (!consumerKeychainPurposeResult) {
    throw consumerKeychainPurposeNotFound(consumerKeychainPurpose);
  }

  return consumerKeychainPurposeResult;
};

export const retrieveKeychainKey = (
  keychain: ConsumerKeychain | KnodeApiKeychain,
  kid: KeyId,
) => {
  const key = keychain.keys.find((key) => key.kid === kid);

  if (!key) {
    throw keyNotFoundInKeychain(kid, keychain.id);
  }

  return key;
};

async function retrieveKeychainUser(
  userId: UserId,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
  keychainKind: KeychainKind,
  cognitoIdmClient: CognitoIdmClient,
): Promise<IdmUser> {
  const user = await cognitoIdmClient.getUserById(userId);
  if (!user) {
    /**
     * This should not happen as users are validated when added as members.
     * If it does happen, it means there's a data inconsistency that should
     * be investigated. Hence, we throw a generic internal error.
     */
    throw genericInternalError(
      `User ${userId} in ${keychainKind} ${keychainId} not found in IDM`,
    );
  }
  return user;
}

export const retrieveFlatProducerKeychain = async (
  producerKeychainId: ProducerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const producerKeychain =
    await readmodelService.getFlatProducerKeychainById(producerKeychainId);

  if (!producerKeychain) {
    throw producerKeychainNotFound(producerKeychainId);
  }

  return producerKeychain;
};

export const retrieveProducerKeychain = async (
  producerKeychainId: ProducerKeychainId,
  readmodelService: ReadmodelService,
) => {
  const producerKeychain =
    await readmodelService.getProducerKeychainById(producerKeychainId);

  if (!producerKeychain) {
    throw producerKeychainNotFound(producerKeychainId);
  }

  return producerKeychain;
};

export async function retrieveKeychainMember<
  K extends ConsumerKeychain | KnodeApiKeychain | ProducerKeychain,
>({
  authData,
  cognitoIdmClient,
  keychain,
  keychainKind,
  userId,
}: {
  authData: UISessionAuthData;
  cognitoIdmClient: CognitoIdmClient;
  keychain: K;
  keychainKind: KeychainKind;
  userId: UserId;
}) {
  assertOrganizationIsKeychainOwner(authData.organizationId, keychain);
  assertUserIsMemberOfKeychain(userId, keychain.id, keychain.users);

  return await retrieveKeychainUser(
    userId,
    keychain.id,
    keychainKind,
    cognitoIdmClient,
  );
}

export async function retrievePaginatedKeychainUsers({
  cognitoIdmClient,
  keychainId,
  keychainKind,
  params,
  users,
}: {
  cognitoIdmClient: CognitoIdmClient;
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId;
  keychainKind: KeychainKind;
  params: API_GetProducerKeychainMembersQueryParams;
  users: KeychainUser[];
}) {
  const paginatedUserIds = users
    .toSorted((a, b) => b.addedAt.getTime() - a.addedAt.getTime()) // Sort by addedAt desc
    .slice(params.offset, params.offset + params.limit);

  return await Promise.all(
    paginatedUserIds.map(({ userId }) =>
      retrieveKeychainUser(userId, keychainId, keychainKind, cognitoIdmClient),
    ),
  );
}
