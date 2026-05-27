import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { API_PaginationQueryParams } from "@knodia/common-models/api";
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
  ProducerKeychainEservice,
} from "@knodia/keychain-models";

import { genericInternalError } from "@knodia/common-models/errors";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  keyNotFoundInKeychain,
  knodeApiKeychainNotFound,
  producerKeychainEserviceNotFound,
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

export const retrieveProducerKeychainEservice = async (
  producerKeychainEservice: Omit<ProducerKeychainEservice, "linkedAt">,
  readmodelService: ReadmodelService,
) => {
  const producerKeychainEserviceResult =
    await readmodelService.getProducerKeychainEservice(
      producerKeychainEservice,
    );

  if (!producerKeychainEserviceResult) {
    throw producerKeychainEserviceNotFound(
      producerKeychainEservice.producerKeychainId,
      producerKeychainEservice.eserviceId,
    );
  }

  return producerKeychainEserviceResult;
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
  paginationParams: { limit, offset },
  users,
}: {
  cognitoIdmClient: CognitoIdmClient;
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId;
  keychainKind: KeychainKind;
  paginationParams: API_PaginationQueryParams;
  users: KeychainUser[];
}) {
  const paginatedUserIds = users
    .toSorted((a, b) => b.addedAt.getTime() - a.addedAt.getTime()) // Sort by addedAt desc
    .slice(offset, offset + limit);

  return await Promise.all(
    paginatedUserIds.map(({ userId }) =>
      retrieveKeychainUser(userId, keychainId, keychainKind, cognitoIdmClient),
    ),
  );
}
