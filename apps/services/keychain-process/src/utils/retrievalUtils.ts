import type {
  ConsumerKeychainId,
  KeyId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  KnodeApiKeychain,
} from "@knodia/keychain-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  keyNotFoundInKeychain,
  knodeApiKeychainNotFound,
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
