import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type {
  RemoteResourceAgreementSQL,
  RemoteResourcePurposeSQL,
} from "@knodia/db-remote-resource";

import {
  agreementNotFound,
  organizationNotAgreementConsumer,
  organizationNotPurposeConsumer,
  purposeNotFound,
} from "../models/errors.ts";

export function assertAgreementExists(
  agreement: RemoteResourceAgreementSQL | undefined,
  agreementId: ExternalId<AgreementId>,
): asserts agreement is RemoteResourceAgreementSQL {
  if (!agreement) {
    throw agreementNotFound(agreementId);
  }
}

export function assertOrganizationIsAgreementConsumer(
  agreement: RemoteResourceAgreementSQL,
  agreementId: ExternalId<AgreementId>,
  organizationId: OrganizationId,
): void {
  if (agreement.consumerId !== organizationId) {
    throw organizationNotAgreementConsumer(agreementId, organizationId);
  }
}

export function assertOrganizationIsPurposeConsumer(
  purpose: RemoteResourcePurposeSQL,
  purposeId: ExternalId<PurposeId>,
  organizationId: OrganizationId,
): void {
  if (purpose.consumerId !== organizationId) {
    throw organizationNotPurposeConsumer(purposeId, organizationId);
  }
}

export function assertPurposeExists(
  purpose: RemoteResourcePurposeSQL | undefined,
  purposeId: ExternalId<PurposeId>,
): asserts purpose is RemoteResourcePurposeSQL {
  if (!purpose) {
    throw purposeNotFound(purposeId);
  }
}
