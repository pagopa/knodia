import type { PurposeId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { purposeNotFound } from "../models/errors.ts";

export const retrievePurpose = async (
  purposeId: PurposeId,
  readmodelService: ReadmodelService,
) => {
  const purpose = await readmodelService.getPurpose(purposeId);

  if (!purpose) {
    throw purposeNotFound(purposeId);
  }

  return purpose.data;
};
