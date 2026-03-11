import type { OrganizationId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  ORGANIZATION_NOT_FOUND: "0001",
  INVALID_ATTRIBUTE: "0002",
} as const;

/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "organization-process",
});

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
