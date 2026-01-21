import { STATUS_CODES } from "http";
import { constants } from "http2";

import { ApiError, createApiError } from "./apiError.ts";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR } =
  constants;

/* eslint-disable perfectionist/sort-objects */
export const commonErrorCodes = {
  GENERIC_ERROR: "9991",
  ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR: "9992",
  RESPONSE_SERIALIZATION_ERROR: "9993",
  MISSING_HEADER: "9994",
  FASTIFY_ERROR: "9995",
} as const;
/* eslint-enable perfectionist/sort-objects */
export type CommonErrorCodes = keyof typeof commonErrorCodes;

/* ===== API Error ===== */

export function fastifyError(
  httpStatus: number,
  detail: string,
): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "FASTIFY_ERROR",
    detail,
    status: httpStatus,
    title: STATUS_CODES[httpStatus] ?? "Unknown Error",
  });
}

export function genericError(details: string): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "GENERIC_ERROR",
    detail: details,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Unexpected Error",
  });
}

export function missingHeader(headerName?: string): ApiError<CommonErrorCodes> {
  const title = "Header has not been passed";
  return createApiError({
    code: "MISSING_HEADER",
    detail: headerName ? `Missing ${headerName} request header` : title,
    status: HTTP_STATUS_BAD_REQUEST,
    title,
  });
}

export function responseSerializationError(): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "RESPONSE_SERIALIZATION_ERROR",
    detail: "Response doesn't match the schema",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Response Serialization Error",
  });
}

export function zodFastifySchemaValidationError(): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR",
    detail: "Request doesn't match the schema",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Response Validation Error",
  });
}
