import type { ExternalId } from "@knodia/common-models/externalResource";
import type { AgreementId, OrganizationId } from "@knodia/common-models/ids";
import type { RemoteResourceAgreementSQL } from "@knodia/db-remote-resource";

import { agreementNotFound } from "../models/errors.ts";

// Both consumerId and authData.organizationId are local node IDs, so this is
// a local-to-local comparison that prevents cross-org access within the same node.
export function assertAgreementOwnedByConsumerOrg(
  agreement: RemoteResourceAgreementSQL | undefined,
  agreementId: ExternalId<AgreementId>,
  organizationId: OrganizationId,
): asserts agreement is RemoteResourceAgreementSQL {
  if (!agreement || agreement.consumerId !== organizationId) {
    throw agreementNotFound(agreementId);
  }
}
