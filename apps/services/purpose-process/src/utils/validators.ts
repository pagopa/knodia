import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  activeAgreementNotFound,
  eserviceNotActive,
} from "../models/errors.ts";

export const assertEserviceIsActive = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const activeVersion =
    await readmodelService.getActiveEserviceVersion(eserviceId);

  if (!activeVersion) {
    throw eserviceNotActive(eserviceId);
  }
};

export const assertActiveAgreementExists = async ({
  consumerId,
  consumerKnodeId,
  eserviceId,
  readmodelService,
}: {
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
  readmodelService: ReadmodelService;
}) => {
  const activeAgreement = await readmodelService.getActiveAgreement({
    consumerId,
    consumerKnodeId,
    eserviceId,
  });

  if (!activeAgreement) {
    throw activeAgreementNotFound({
      consumerId,
      consumerKnodeId,
      eserviceId,
    });
  }
};
