import { ApiError, createApiError } from "./apiError.ts";

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
  return createApiError(
    commonErrorCodes.GENERIC_ERROR.code,
    details,
    "Unexpected Error",
  );
}

export function missingHeader(headerName?: string): ApiError<CommonErrorCodes> {
  const title = "Header has not been passed";
  return createApiError(
    commonErrorCodes.MISSING_HEADER.code,
    headerName ? `Missing ${headerName} request header` : title,
    title,
  );
}
