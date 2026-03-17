import type { AgreementState } from "@knodia/agreement-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { Eservice, EserviceVersionState } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementAlreadyExists,
  eserviceVersionNotInExpectedState,
} from "../models/errors.ts";
import { retrieveEserviceVersion } from "./readmodelUtils.ts";

const agreementCreationAllowedEserviceVersionStates: EserviceVersionState[] = [
  "Active",
  "Suspended",
];

export const assertEserviceVersionIsActiveOrSuspended = async (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  readmodelService: ReadmodelService,
) => {
  const allowedStates = agreementCreationAllowedEserviceVersionStates;

  const eserviceVersion = await retrieveEserviceVersion(
    eservice.id,
    eserviceVersionId,
    readmodelService,
  );

  if (!allowedStates.includes(eserviceVersion.state)) {
    throw eserviceVersionNotInExpectedState(
      eservice.id,
      eserviceVersionId,
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
