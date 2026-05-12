import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type {
  RemoteResourceAgreementSQL,
  RemoteResourcePurposeSQL,
} from "@knodia/db-remote-resource";
import type { ExternalUISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import {
  agreementNotFound,
  organizationNotAgreementConsumer,
  organizationNotPurposeConsumer,
  organizationTokenClaimMismatch,
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

// Agreement producers are always local to this knode, while consumers
// are remote. So the consumer values from the token are checked here.
export function assertTokenRemoteOrganizationClaimsMatchRequest(
  authData: ExternalUISessionAuthData,
  pathOrganizationId: ExternalId<OrganizationId>,
  queryKnodeId: KnodeId,
): void {
  if (pathOrganizationId !== authData.consumer.id) {
    throw organizationTokenClaimMismatch(
      "consumer.id",
      authData.consumer.id,
      pathOrganizationId,
    );
  }

  if (queryKnodeId !== authData.consumer.knodeId) {
    throw organizationTokenClaimMismatch(
      "consumer.knodeId",
      authData.consumer.knodeId,
      queryKnodeId,
    );
  }
}
