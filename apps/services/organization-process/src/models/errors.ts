import type { OrganizationId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

type ExternalUISessionOrganizationClaimField =
  | "producer.id"
  | "producer.knodeId";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
} = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  ORGANIZATION_NOT_FOUND: "0001",
  INVALID_ATTRIBUTE: "0002",
  DUPLICATE_ORGANIZATION_NAME: "0003",
  ORGANIZATION_TOKEN_CLAIM_MISMATCH: "0004",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export function organizationTokenClaimMismatch(
  field: ExternalUISessionOrganizationClaimField,
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
  serviceName: "organization-process",
});

export function duplicateOrganizationName(name: string) {
  return createApiError<ErrorCodes>({
    code: "DUPLICATE_ORGANIZATION_NAME",
    detail: `An organization with name "${name}" already exists`,
    status: HTTP_STATUS_CONFLICT,
    title: "Duplicate Organization Name",
  });
}

export function invalidAttribute(scheme: string, code: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_ATTRIBUTE",
    detail: `Invalid attribute: scheme=${scheme}, code=${code}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Attribute",
  });
}

export function organizationNotFound(organizationId: OrganizationId) {
  return createApiError<ErrorCodes>({
    code: "ORGANIZATION_NOT_FOUND",
    detail: `Organization with id ${organizationId} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Organization Not Found",
  });
}
