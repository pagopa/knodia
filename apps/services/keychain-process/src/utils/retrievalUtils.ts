import type {
  ConsumerKeychainId,
  KeyId,
  KnodiaApiKeychainId,
} from "@knodia/common-models/ids";
import type {
  ConsumerKeychain,
  ConsumerKeychainPurpose,
  KnodiaApiKeychain,
} from "@knodia/keychain-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  keyNotFoundInKeychain,
  knodiaApiKeychainNotFound,
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

export const retrieveConsumerKeychainKey = (
  consumerKeychain: ConsumerKeychain,
  kid: KeyId,
) => {
  const key = consumerKeychain.keys.find((key) => key.kid === kid);

  if (!key) {
    throw keyNotFoundInKeychain(kid, consumerKeychain.id);
  }

  return key;
};

export const retrieveKnodiaApiKeychain = async (
  knodiaApiKeychainId: KnodiaApiKeychainId,
  readmodelService: ReadmodelService,
) => {
  const knodiaApiKeychain =
    await readmodelService.getKnodiaApiKeychainById(knodiaApiKeychainId);

  if (!knodiaApiKeychain) {
    throw knodiaApiKeychainNotFound(knodiaApiKeychainId);
  }

  return knodiaApiKeychain;
};

export const retrieveKnodiaApiKeychainKey = (
  keychain: KnodiaApiKeychain,
  kid: KeyId,
) => {
  const key = keychain.keys.find((key) => key.kid === kid);

  if (!key) {
    throw keyNotFoundInKeychain(kid, keychain.id);
  }

  return key;
};
