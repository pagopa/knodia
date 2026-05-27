import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type {
  ConsumerKeychainId,
  KeyId,
  KnodeApiKeychainId,
  ProducerKeychainId,
  UserId,
} from "@knodia/common-models/ids";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  KnodeApiKeychain,
} from "@knodia/keychain-models";

import { genericInternalError } from "@knodia/common-models/errors";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  keyNotFoundInKeychain,
  knodeApiKeychainNotFound,
  producerKeychainNotFound,
} from "../models/errors.ts";

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

export async function retrieveKeychainUser(
  userId: UserId,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId,
  keychainKind: "Consumer Keychain" | "Knode API Keychain",
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
