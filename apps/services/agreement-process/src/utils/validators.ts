import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";

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
  agreementNotInReactivatableState,
  agreementNotInSuspendableState,
  consumerMissingRequiredAttributes,
  eserviceVersionNotInExpectedStates,
  eserviceVersionNotLatest,
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
