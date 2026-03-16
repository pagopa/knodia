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
  const activeEserviceExists =
    await readmodelService.eserviceVersionExistsByStates({
      eserviceId,
      states: ["Active"],
    });

  if (!activeEserviceExists) {
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
  const activeAgreementExists = await readmodelService.agreementExistsByStates({
    consumerId,
    consumerKnodeId,
    eserviceId,
    states: ["Active"],
  });

  if (!activeAgreementExists) {
    throw activeAgreementNotFound({
      consumerId,
      consumerKnodeId,
      eserviceId,
    });
  }
};
