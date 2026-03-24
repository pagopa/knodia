import type { Agreement } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { Eservice } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementNotFound,
  eserviceNotFound,
  purposeNotFound,
} from "../models/errors.ts";

export const retrieveAgreements = async ({
  consumerId,
  consumerKnodeId,
  eserviceId,
  readmodelService,
}: {
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
  readmodelService: ReadmodelService;
}): Promise<Agreement[]> => {
  const agreements = await readmodelService.getAgreementsByConsumerAndEservice({
    consumerId,
    consumerKnodeId,
    eserviceId,
  });

  if (agreements.length === 0) {
    throw agreementNotFound({ consumerId, consumerKnodeId, eserviceId });
  }

  return agreements;
};

export const retrieveEservice = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
): Promise<Eservice> => {
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

  return purpose;
};
