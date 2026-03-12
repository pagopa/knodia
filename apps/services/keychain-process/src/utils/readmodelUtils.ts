import type { ConsumerKeychainId } from "@knodia/common-models/ids";

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
