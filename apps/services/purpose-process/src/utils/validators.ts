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
  const hasActiveVersion =
    await readmodelService.hasActiveEserviceVersion(eserviceId);

  if (!hasActiveVersion) {
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
  const agreements = await readmodelService.getAgreements({
    consumerId,
    consumerKnodeId,
    eserviceId,
    state: ["Active"],
  });

  if (agreements.results.length === 0) {
    throw activeAgreementNotFound({
      consumerId,
      consumerKnodeId,
      eserviceId,
    });
  }
};
