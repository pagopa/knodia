import type { EserviceId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { eserviceNotFound } from "../models/errors.ts";

export async function retrieveEserviceById(
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) {
  const eservice = await readmodelService.getEserviceById(eserviceId);

  if (!eservice) {
    throw eserviceNotFound(eserviceId);
  }

  return eservice;
}
