import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { ExternalUISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import {
  type Agreement,
  AgreementActor,
  AgreementState,
} from "@knodia/agreement-models";
import {
  type AttributeId,
  hasAllRequiredAttributes,
} from "@knodia/attribute-models";
import {
  type Eservice,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { match } from "ts-pattern";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementAlreadyExists,
  agreementNotInActivatableState,
  agreementNotInReactivatableState,
  agreementNotInSuspendableState,
  agreementTokenClaimMismatch,
  consumerMissingRequiredAttributes,
  eserviceVersionNotInExpectedStates,
  eserviceVersionNotLatest,
  type ExternalUISessionClaimField,
  organizationNotAgreementProducer,
} from "../models/errors.ts";
import {
  retrieveEserviceLatestVersion,
  retrieveEserviceVersionFromEservice,
} from "./utils.ts";

const agreementCreationAllowedEserviceVersionStates: EserviceVersionState[] = [
  EserviceVersionState.enum.Active,
  EserviceVersionState.enum.Suspended,
];

export function assertAgreementCanBeReactivatedBy(
  agreement: Agreement,
  reactivatedBy: AgreementActor,
): void {
  if (
    agreement.state !== AgreementState.enum.Suspended ||
    getOwnSuspendedAt(agreement, reactivatedBy) === null
  ) {
    throw agreementNotInReactivatableState({
      agreementId: agreement.id,
      reactivatedBy,
      state: agreement.state,
      suspendedByConsumerAt: agreement.suspendedByConsumerAt,
      suspendedByProducerAt: agreement.suspendedByProducerAt,
    });
  }
}

export function assertAgreementCanBeSuspendedBy(
  agreement: Agreement,
  suspendedBy: AgreementActor,
): void {
  const throwNotSuspendable = (): never => {
    throw agreementNotInSuspendableState({
      agreementId: agreement.id,
      state: agreement.state,
      suspendedBy,
      suspendedByConsumerAt: agreement.suspendedByConsumerAt,
      suspendedByProducerAt: agreement.suspendedByProducerAt,
    });
  };

  match(agreement.state)
    .with(AgreementState.enum.Active, () => undefined)
    .with(AgreementState.enum.Suspended, () => {
      if (getOwnSuspendedAt(agreement, suspendedBy) !== null) {
        throwNotSuspendable();
      }
      // Consumer cannot suspend an agreement already suspended by the producer.
      // Consumer's only action on a producer-suspended agreement is to archive.
      if (
        suspendedBy === AgreementActor.enum.Consumer &&
        agreement.suspendedByProducerAt !== null
      ) {
        throwNotSuspendable();
      }
    })
    .with(
      AgreementState.enum.Archived,
      AgreementState.enum.PendingConsumerOperatorIdentification,
      () => {
        throwNotSuspendable();
      },
    )
    .exhaustive();
}

export function assertOrganizationIsAgreementProducer(
  agreement: Agreement,
  organizationId: OrganizationId,
): void {
  if (agreement.producerId !== organizationId) {
    throw organizationNotAgreementProducer(agreement.id, organizationId);
  }
}

function getOwnSuspendedAt(
  agreement: Agreement,
  actor: AgreementActor,
): Date | null {
  return match(actor)
    .with(AgreementActor.enum.Producer, () => agreement.suspendedByProducerAt)
    .with(AgreementActor.enum.Consumer, () => agreement.suspendedByConsumerAt)
    .exhaustive();
}

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
    throw agreementNotInActivatableState(agreement.id, agreement.state);
  }
}

export function assertTokenAgreementIdMatchesPathParam(
  tokenAgreementId: AgreementId,
  pathAgreementId: AgreementId,
): void {
  if (tokenAgreementId !== pathAgreementId) {
    throw agreementTokenClaimMismatch(
      "agreement.id",
      tokenAgreementId,
      pathAgreementId,
    );
  }
}

export function assertTokenResourceClaimsMatchAgreement(
  authData: ExternalUISessionAuthData,
  agreement: Agreement,
  currentKnodeId: KnodeId,
): void {
  const checks: {
    expectedValue: string;
    field: ExternalUISessionClaimField;
    tokenValue: string;
  }[] = [
    {
      expectedValue: currentKnodeId,
      field: "agreement.knodeId",
      tokenValue: authData.agreement.knodeId,
    },
    {
      expectedValue: agreement.consumer.id,
      field: "consumer.id",
      tokenValue: authData.consumer.id,
    },
    {
      expectedValue: agreement.consumer.knodeId,
      field: "consumer.knodeId",
      tokenValue: authData.consumer.knodeId,
    },
    {
      expectedValue: agreement.eserviceId,
      field: "eservice.id",
      tokenValue: authData.eservice.id,
    },
    {
      expectedValue: currentKnodeId,
      field: "eservice.knodeId",
      tokenValue: authData.eservice.knodeId,
    },
    {
      expectedValue: agreement.eserviceVersionId,
      field: "eservice.version",
      tokenValue: authData.eservice.version,
    },
    {
      expectedValue: agreement.producerId,
      field: "producer.id",
      tokenValue: authData.producer.id,
    },
    {
      expectedValue: currentKnodeId,
      field: "producer.knodeId",
      tokenValue: authData.producer.knodeId,
    },
  ];

  for (const { expectedValue, field, tokenValue } of checks) {
    if (tokenValue !== expectedValue) {
      throw agreementTokenClaimMismatch(field, tokenValue, expectedValue);
    }
  }
}
