import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { eserviceNotFoundForProducer } from "../models/errors.ts";

export async function retrieveEserviceByIdAndProducerId(
  eserviceId: EserviceId,
  producerId: OrganizationId,
  readmodelService: ReadmodelService,
) {
  const eservice = await readmodelService.getEserviceByIdAndProducerId(
    eserviceId,
    producerId,
  );

  if (!eservice) {
    throw eserviceNotFoundForProducer(eserviceId, producerId);
  }

  return eservice;
}
