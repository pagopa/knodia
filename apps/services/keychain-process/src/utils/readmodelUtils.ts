import type { ExternalId } from "@knodia/common-models/externalResource";
import type { ConsumerKeychainId, PurposeId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { consumerKeychainNotFound } from "../models/errors.ts";

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
  consumerKeychainId: ConsumerKeychainId,
  purposeId: ExternalId<PurposeId>,
  readmodelService: ReadmodelService,
) => {
  const consumerKeychainPurpose =
    await readmodelService.getConsumerKeychainPurpose(
      consumerKeychainId,
      purposeId,
    );

  if (!consumerKeychainPurpose) {
    throw consumerKeychainNotFound(consumerKeychainId);
  }

  return consumerKeychainPurpose;
};
