import type { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerKeychainNotFound,
  consumerKeychainPurposeNotFound,
  purposeNotFound,
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

export const retrievePurpose = async (
  purposeId: PurposeId,
  readmodelService: ReadmodelService,
) => {
  const purpose = await readmodelService.getPurpose(purposeId);

  if (!purpose) {
    throw purposeNotFound(purposeId);
  }

  return purpose;
};

export const retrieveConsumerKeychainPurpose = async (
  consumerKeychainId: ConsumerKeychainId,
  purposeId: PurposeId,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychainPurpose =
    await readmodelService.getConsumerKeychainPurposeByKeychainId(
      consumerKeychainId,
      purposeId,
    );

  if (!consumerKeychainPurpose) {
    throw consumerKeychainPurposeNotFound(consumerKeychainId, purposeId);
  }

  return consumerKeychainPurpose;
};
