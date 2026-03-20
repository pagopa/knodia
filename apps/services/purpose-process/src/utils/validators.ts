import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";

import { type Agreement, AgreementState } from "@knodia/agreement-models";
import {
  type Eservice,
  type EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";

import {
  agreementNotInExpectedStates,
  eserviceModeNotAllowed,
  eserviceVersionNotInExpectedStates,
} from "../models/errors.ts";

const purposeCreationAllowedEserviceVersionStates: EserviceVersionState[] = [
  EserviceVersionState.enum.Active,
  EserviceVersionState.enum.Suspended,
];

const purposeCreationAllowedAgreementStates: AgreementState[] = [
  AgreementState.enum.Active,
  AgreementState.enum.Suspended,
];

export const assertEserviceModeIs = (
  eservice: Eservice,
  expectedMode: EserviceMode,
) => {
  if (eservice.mode !== expectedMode) {
    throw eserviceModeNotAllowed(eservice.id, eservice.mode, expectedMode);
  }
};

export const assertEserviceAllowsPurposeCreation = (eservice: Eservice) => {
  const hasAllowedVersion = eservice.versions.some((v) =>
    purposeCreationAllowedEserviceVersionStates.includes(v.state),
  );

  if (!hasAllowedVersion) {
    throw eserviceVersionNotInExpectedStates(
      eservice.id,
      purposeCreationAllowedEserviceVersionStates,
    );
  }
};

export const assertAgreementAllowsPurposeCreation = ({
  agreements,
  consumerId,
  consumerKnodeId,
  eserviceId,
}: {
  agreements: Agreement[];
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
}) => {
  const hasAllowedAgreement = agreements.some((a) =>
    purposeCreationAllowedAgreementStates.includes(a.state),
  );

  if (!hasAllowedAgreement) {
    throw agreementNotInExpectedStates({
      allowedStates: purposeCreationAllowedAgreementStates,
      consumerId,
      consumerKnodeId,
      eserviceId,
    });
  }
};
