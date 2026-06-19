import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  KnodeId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

type ExternalUISessionRemoteOrganizationClaimField =
  | "consumer.id"
  | "consumer.knodeId";

const {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_NOT_IMPLEMENTED,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  AGREEMENT_NOT_FOUND: "0001",
  ORGANIZATION_NOT_FOUND: "0002",
  PURPOSE_NOT_FOUND: "0003",
  ORGANIZATION_NOT_AGREEMENT_CONSUMER: "0004",
  ORGANIZATION_NOT_PURPOSE_CONSUMER: "0005",
  ORGANIZATION_TOKEN_CLAIM_MISMATCH: "0006",
  TARGET_KNODE_URL_NOT_CONFIGURED: "0007",
  MULTI_KNODE_LISTING_NOT_SUPPORTED: "0008",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export function organizationTokenClaimMismatch(
  field: ExternalUISessionRemoteOrganizationClaimField,
  tokenValue: string,
  expectedValue: string,
) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_TOKEN_CLAIM_MISMATCH",
    detail: `Token claim "${field}" (${tokenValue}) does not match expected value (${expectedValue})`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization Token Claim Mismatch",
  });
}

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "remote-resources-manager",
});

export function agreementNotFound(agreementId: ExternalId<AgreementId>) {
  return createApiError<ErrorCodes>({
    code: "AGREEMENT_NOT_FOUND",
    detail: `Agreement with id ${agreementId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Agreement Not Found",
  });
}

// Provisional (KN-589): cross-knode listings are single-knode until cross-knode event propagation lands.
export function multiKnodeListingNotSupported(knodes: KnodeId[]) {
  return createApiError<ErrorCodes>({
    code: "MULTI_KNODE_LISTING_NOT_SUPPORTED",
    detail: `Cross-knode listings currently support a single remote knode, but ${knodes.length} were found: ${knodes.join(", ")}`,
    status: HTTP_STATUS_NOT_IMPLEMENTED,
    title: "Multi-knode listing not supported",
  });
}

export function organizationNotAgreementConsumer(
  agreementId: ExternalId<AgreementId>,
  organizationId: OrganizationId,
) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_AGREEMENT_CONSUMER",
    detail: `Organization ${organizationId} is not the consumer of Agreement ${agreementId}. Only the consumer can perform this operation.`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization is not the Agreement consumer",
  });
}

export function organizationNotFound(organizationId: OrganizationId) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_FOUND",
    detail: `Organization with id ${organizationId} not found`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization Not Found",
  });
}

export function organizationNotPurposeConsumer(
  purposeId: ExternalId<PurposeId>,
  organizationId: OrganizationId,
) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_PURPOSE_CONSUMER",
    detail: `Organization ${organizationId} is not the consumer of Purpose ${purposeId}. Only the consumer can perform this operation.`,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Organization is not the Purpose consumer",
  });
}

export function purposeNotFound(purposeId: ExternalId<PurposeId>) {
  return createApiError<ErrorCodes>({
    code: "PURPOSE_NOT_FOUND",
    detail: `Purpose with id ${purposeId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Purpose Not Found",
  });
}

export function targetKnodeUrlNotConfigured(targetKnodeId: KnodeId) {
  return createApiError<ErrorCodes>({
    code: "TARGET_KNODE_URL_NOT_CONFIGURED",
    detail: `No TARGET_KNODE_URLS entry configured for Knode ${targetKnodeId}`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Target Knode URL Not Configured",
  });
}
