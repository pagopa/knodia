import { constants } from "http2";

import { ApiError, createApiError } from "./apiError.ts";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR } =
  constants;

export const commonErrorCodes = {
  GENERIC_ERROR: { code: "GENERIC_ERROR", number: "9991" },
  MISSING_HEADER: {
    code: "MISSING_HEADER",
    number: "9994",
  },
  RESPONSE_SERIALIZATION_ERROR: {
    code: "RESPONSE_SERIALIZATION_ERROR",
    number: "9993",
  },
  ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR: {
    code: "ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR",
    number: "9992",
  },
} as const;

export type CommonErrorCodes = keyof typeof commonErrorCodes;

/* ===== API Error ===== */

export function genericError(details: string): ApiError<CommonErrorCodes> {
  return createApiError({
    code: commonErrorCodes.GENERIC_ERROR.code,
    detail: details,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Unexpected Error",
  });
}

export function missingHeader(headerName?: string): ApiError<CommonErrorCodes> {
  const title = "Header has not been passed";
  return createApiError({
    code: commonErrorCodes.MISSING_HEADER.code,
    detail: headerName ? `Missing ${headerName} request header` : title,
    status: HTTP_STATUS_BAD_REQUEST,
    title,
  });
}

export function responseSerializationError(): ApiError<CommonErrorCodes> {
  return createApiError({
    code: commonErrorCodes.RESPONSE_SERIALIZATION_ERROR.code,
    detail: "Response doesn't match the schema",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Response Serialization Error",
  });
}

export function zodFastifySchemaValidationError(): ApiError<CommonErrorCodes> {
  return createApiError({
    code: commonErrorCodes.ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR.code,
    detail: "Request doesn't match the schema",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Response Validation Error",
  });
}
