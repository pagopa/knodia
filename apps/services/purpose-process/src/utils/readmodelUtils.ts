import type { EserviceId, PurposeId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { eserviceNotFound, purposeNotFound } from "../models/errors.ts";

export const retrieveEservice = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eservice = await readmodelService.getEservice(eserviceId);

  if (!eservice) {
    throw eserviceNotFound(eserviceId);
  }

  return eservice.data;
};

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
