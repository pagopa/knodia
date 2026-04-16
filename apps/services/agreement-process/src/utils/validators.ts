import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { ExternalUISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import { type Agreement, AgreementState } from "@knodia/agreement-models";
import {
  type AttributeId,
  hasAllRequiredAttributes,
} from "@knodia/attribute-models";
import {
  type Eservice,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementAlreadyExists,
  agreementIdMismatch,
  agreementNotInExpectedState,
  consumerMissingRequiredAttributes,
  eserviceVersionNotInExpectedStates,
  eserviceVersionNotLatest,
  resourceClaimMismatch,
} from "../models/errors.ts";
import {
  retrieveEserviceLatestVersion,
  retrieveEserviceVersionFromEservice,
} from "./utils.ts";

const agreementCreationAllowedEserviceVersionStates: EserviceVersionState[] = [
  EserviceVersionState.enum.Active,
  EserviceVersionState.enum.Suspended,
];

export const assertEserviceVersionAllowsAgreementCreation = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
): EserviceVersion => {
  const eserviceVersion = retrieveEserviceVersionFromEservice(
    eservice,
    eserviceVersionId,
  );

  if (
    !agreementCreationAllowedEserviceVersionStates.includes(
      eserviceVersion.state,
    )
  ) {
    throw eserviceVersionNotInExpectedStates(
      eservice.id,
      eserviceVersionId,
      agreementCreationAllowedEserviceVersionStates,
    );
  }

  return eserviceVersion;
};

export function assertConsumerHasRequiredAttributes(
  consumerAttributes: readonly AttributeId[],
  requiredAttributes: readonly AttributeId[][],
  consumerId: ExternalId<OrganizationId>,
  eserviceId: EserviceId,
): void {
  if (!hasAllRequiredAttributes(consumerAttributes, requiredAttributes)) {
    throw consumerMissingRequiredAttributes(consumerId, eserviceId);
  }
}

export const assertEserviceVersionIsLatest = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
) => {
  const eserviceLatestVersion = retrieveEserviceLatestVersion(eservice);

  if (eserviceLatestVersion.id !== eserviceVersionId) {
    throw eserviceVersionNotLatest(
      eservice.id,
      eserviceVersionId,
      eserviceLatestVersion.id,
    );
  }
};
export const agreementCreationConflictingStates: AgreementState[] = [
  AgreementState.enum.Active,
  AgreementState.enum.Suspended,
  AgreementState.enum.PendingConsumerOperatorIdentification,
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

export function assertAgreementIsPendingConsumerOperatorIdentification(
  agreement: Agreement,
): void {
  if (
    agreement.state !==
    AgreementState.enum.PendingConsumerOperatorIdentification
  ) {
    throw agreementNotInExpectedState(
      agreement.id,
      agreement.state,
      AgreementState.enum.PendingConsumerOperatorIdentification,
    );
  }
}

export function assertTokenAgreementIdMatchesPathParam(
  tokenAgreementId: AgreementId,
  pathAgreementId: AgreementId,
): void {
  if (tokenAgreementId !== pathAgreementId) {
    throw agreementIdMismatch(tokenAgreementId, pathAgreementId);
  }
}

export function assertTokenResourceClaimsMatchAgreement(
  authData: ExternalUISessionAuthData,
  agreement: Agreement,
): void {
  const checks: {
    agreementValue: string;
    field: string;
    tokenValue: string;
  }[] = [
    {
      agreementValue: agreement.consumer.id,
      field: "consumerId",
      tokenValue: authData.consumerId,
    },
    {
      agreementValue: agreement.consumer.knodeId,
      field: "consumerKnodeId",
      tokenValue: authData.consumerKnodeId,
    },
    {
      agreementValue: agreement.eserviceId,
      field: "eserviceId",
      tokenValue: authData.eserviceId,
    },
    {
      agreementValue: agreement.producerId,
      field: "producerId",
      tokenValue: authData.producerId,
    },
    {
      agreementValue: agreement.eserviceVersionId,
      field: "eserviceVersionId",
      tokenValue: authData.eserviceVersionId,
    },
  ];

  for (const { agreementValue, field, tokenValue } of checks) {
    if (tokenValue !== agreementValue) {
      throw resourceClaimMismatch(
        agreement.id,
        field,
        tokenValue,
        agreementValue,
      );
    }
  }
}
