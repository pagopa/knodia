import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type {
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

export const assertAgreementCanBeCreated = async (
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  readmodelService: ReadmodelService,
) => {
  const allowedEserviceVersionStatesForCreation: EserviceVersionState[] = [
    "Active",
  ];
  const allowedEserviceVersionStates: EserviceVersionState[] = [
    "Active",
    "Suspended",
    "Archived",
  ];

  const eserviceLatestVersion = await retrieveEserviceLatestVersion(
    eserviceId,
    readmodelService,
    allowedEserviceVersionStates,
  );

  if (eserviceLatestVersion.id !== eserviceVersionId) {
    throw eserviceVersionNotLatest(
      eserviceId,
      eserviceVersionId,
      eserviceLatestVersion.id,
    );
  }

  assertEserviceVersionIsInExpectedStates(
    eserviceId,
    eserviceLatestVersion,
    allowedEserviceVersionStatesForCreation,
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
