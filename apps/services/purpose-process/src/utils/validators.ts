import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { EserviceVersionState } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementNotInExpectedState,
  eserviceVersionNotInExpectedState,
} from "../models/errors.ts";

const purposeCreationAllowedEserviceVersionStates: EserviceVersionState[] = [
  "Active",
  "Suspended",
];

const purposeCreationAllowedAgreementStates: AgreementState[] = [
  "Active",
  "Suspended",
];

export const assertEserviceIsActiveOrSuspended = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const exists = await readmodelService.eserviceVersionExistsByStates({
    eserviceId,
    states: purposeCreationAllowedEserviceVersionStates,
  });

  if (!exists) {
    throw eserviceVersionNotInExpectedState(
      eserviceId,
      purposeCreationAllowedEserviceVersionStates,
    );
  }
};

export const assertActiveOrSuspendedAgreementExists = async ({
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
  const exists = await readmodelService.agreementExistsByStates({
    consumerId,
    consumerKnodeId,
    eserviceId,
    states: purposeCreationAllowedAgreementStates,
  });

  if (!exists) {
    throw agreementNotInExpectedState({
      allowedStates: purposeCreationAllowedAgreementStates,
      consumerId,
      consumerKnodeId,
      eserviceId,
    });
  }
};
