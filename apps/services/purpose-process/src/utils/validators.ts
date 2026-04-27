import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";

import { type Agreement, AgreementState } from "@knodia/agreement-models";
import {
  type Eservice,
  type EserviceMode,
  EserviceVersionState,
} from "@knodia/eservice-models";
import {
  type Purpose,
  PurposeActor,
  PurposeState,
} from "@knodia/purpose-models";
import { match } from "ts-pattern";

import {
  agreementNotInExpectedStates,
  eserviceModeNotAllowed,
  eserviceVersionNotInExpectedStates,
  organizationNotPurposeProducer,
  purposeNotInArchivableState,
  purposeNotInReactivatableState,
  purposeNotInSuspendableState,
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

export function assertOrganizationIsPurposeProducer(
  eservice: Eservice,
  purposeId: PurposeId,
  organizationId: OrganizationId,
): void {
  if (eservice.producerId !== organizationId) {
    throw organizationNotPurposeProducer(purposeId, organizationId);
  }
}

export function assertPurposeCanBeReactivatedBy(
  purpose: Purpose,
  reactivatedBy: PurposeActor,
): void {
  if (
    purpose.state !== PurposeState.enum.Suspended ||
    getOwnSuspendedAt(purpose, reactivatedBy) === null
  ) {
    throw purposeNotInReactivatableState({
      purposeId: purpose.id,
      reactivatedBy,
      state: purpose.state,
      suspendedByConsumerAt: purpose.suspendedByConsumerAt,
      suspendedByProducerAt: purpose.suspendedByProducerAt,
    });
  }
}

export function assertPurposeCanBeSuspendedBy(
  purpose: Purpose,
  suspendedBy: PurposeActor,
): void {
  const throwNotSuspendable = (): never => {
    throw purposeNotInSuspendableState({
      purposeId: purpose.id,
      state: purpose.state,
      suspendedBy,
      suspendedByConsumerAt: purpose.suspendedByConsumerAt,
      suspendedByProducerAt: purpose.suspendedByProducerAt,
    });
  };

  match(purpose.state)
    .with(PurposeState.enum.Active, () => undefined)
    .with(PurposeState.enum.Suspended, () => {
      if (getOwnSuspendedAt(purpose, suspendedBy) !== null) {
        throwNotSuspendable();
      }
      // Consumer cannot suspend a purpose already suspended by the producer.
      // Consumer's only action on a producer-suspended purpose is to archive.
      if (
        suspendedBy === PurposeActor.enum.Consumer &&
        purpose.suspendedByProducerAt !== null
      ) {
        throwNotSuspendable();
      }
    })
    .with(PurposeState.enum.Archived, () => {
      throwNotSuspendable();
    })
    .exhaustive();
}

export function assertPurposeIsSuspended(purpose: Purpose): void {
  if (purpose.state !== PurposeState.enum.Suspended) {
    throw purposeNotInArchivableState({
      purposeId: purpose.id,
      state: purpose.state,
    });
  }
}

function getOwnSuspendedAt(purpose: Purpose, actor: PurposeActor): Date | null {
  return match(actor)
    .with(PurposeActor.enum.Producer, () => purpose.suspendedByProducerAt)
    .with(PurposeActor.enum.Consumer, () => purpose.suspendedByConsumerAt)
    .exhaustive();
}
