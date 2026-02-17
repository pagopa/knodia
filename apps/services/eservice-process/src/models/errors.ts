import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";

import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  ESERVICE_NOT_FOUND: "0001",
  INVALID_ATTRIBUTE: "0002",
  INVALID_CATEGORY: "0003",
  ESERVICE_VERSION_NOT_FOUND: "0004",
} as const;
/* eslint-enable perfectionist/sort-objects */
type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes);

export function eserviceNotFound(id: EserviceId) {
  return createApiError<ErrorCodes>({
    code: "ESERVICE_NOT_FOUND",
    detail: `E-service with id ${id} not found`,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Not Found",
  });
}

export function eserviceVersionNotFound(
  eserviceId: EserviceId,
  versionId?: EserviceVersionId,
) {
  const detail = versionId
    ? `E-service version '${versionId}' not found for e-service '${eserviceId}'`
    : `No versions found for e-service '${eserviceId}'`;

  return createApiError<ErrorCodes>({
    code: "ESERVICE_VERSION_NOT_FOUND",
    detail,
    status: HTTP_STATUS_NOT_FOUND,
    title: "E-service Version Not Found",
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

export function invalidCategory(scheme: string, code: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_CATEGORY",
    detail: `Invalid category: scheme=${scheme}, code=${code}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Category",
  });
}
