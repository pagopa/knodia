import type { ExternalId } from "@knodia/common-models/externalResource";
import type { AgreementId, OrganizationId } from "@knodia/common-models/ids";
import type { RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";

import {
  agreementNotFound,
  organizationNotAgreementConsumer,
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
