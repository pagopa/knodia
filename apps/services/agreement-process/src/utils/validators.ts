import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type {
  Eservice,
  EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementAlreadyExists,
  eserviceVersionNotInExpectedState,
  eserviceVersionNotLatest,
} from "../models/errors.ts";
import { retrieveEserviceLatestVersion } from "./readmodelUtils.ts";

export const assertAgreementCanBeActivated = async (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  readmodelService: ReadmodelService,
) => {
  const allowedEserviceVersionStatesForActivation: EserviceVersionState[] = [
    "Active",
  ];
  const allowedEserviceVersionStates: EserviceVersionState[] = [
    "Active",
    "Suspended",
    "Archived",
  ];

  const eserviceLatestVersion = await retrieveEserviceLatestVersion(
    eservice.id,
    readmodelService,
    allowedEserviceVersionStates,
  );

  if (eserviceLatestVersion.id !== eserviceVersionId) {
    throw eserviceVersionNotLatest(eserviceVersionId, eserviceLatestVersion.id);
  }

  assertEserviceVersionIsInExpectedStates(
    eservice.id,
    eserviceLatestVersion,
    allowedEserviceVersionStatesForActivation,
  );
};

const assertEserviceVersionIsInExpectedStates = (
  eserviceId: EserviceId,
  eserviceVersion: Omit<EserviceVersion, "interfaceDocument">,
  allowedStates: EserviceVersionState[],
) => {
  if (!allowedStates.includes(eserviceVersion.state)) {
    throw eserviceVersionNotInExpectedState(
      eserviceId,
      eserviceVersion.id,
      allowedStates,
    );
  }
};

export const agreementCreationConflictingStates: AgreementState[] = [
  "Active",
  "Suspended",
];
export const assertNoConflictingAgreementsExist = async ({
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
    limit: 1,
    offset: 0,
    state: agreementCreationConflictingStates,
  });

  if (agreements.results.length > 0) {
    throw agreementAlreadyExists({
      consumerId,
      consumerKnodeId,
      eserviceId,
    });
  }
};
