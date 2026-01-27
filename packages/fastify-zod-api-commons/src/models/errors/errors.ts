import type { FastifyError } from "@fastify/error";
import type {
  ResponseSerializationError,
  ZodFastifySchemaValidationError,
} from "fastify-type-provider-zod";

import { STATUS_CODES } from "http";
import { constants } from "http2";

import {
  ApiError,
  createApiError,
  createApiErrorFromErrorsList,
} from "./apiError.ts";

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

/* ===== Common API errors ===== */

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

export function responseSerializationError(
  error: ResponseSerializationError,
): ApiError<CommonErrorCodes> {
  return createApiErrorFromErrorsList({
    code: "RESPONSE_SERIALIZATION_ERROR",
    errors: error.cause.issues,
    status: error.statusCode || HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Response Serialization Error",
  });
}

export function zodFastifySchemaValidationError(
  error: Omit<FastifyError, "validation" | "validationContext"> & {
    validation: ZodFastifySchemaValidationError[];
    validationContext?: string;
  },
): ApiError<CommonErrorCodes> {
  const context = error.validationContext ?? "request";
  const errors = error.validation.map((validationError) => {
    const path = validationError.instancePath || "";
    const message = validationError.message || "Invalid value";
    const fullPath = path ? `${context}${path}` : context;
    return new Error(`${message} at "${fullPath}"`);
  });

  return createApiErrorFromErrorsList({
    code: "ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR",
    errors,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Request Validation Error",
  });
}
