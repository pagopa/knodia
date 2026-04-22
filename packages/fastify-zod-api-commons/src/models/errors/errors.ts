import type { FastifyError } from "@fastify/error";
import type {
  ResponseSerializationError,
  ZodFastifySchemaValidationError,
} from "fastify-type-provider-zod";

import { STATUS_CODES } from "http";
import { constants } from "http2";
import { toDotPath } from "zod/v4/core";

import {
  type ApiError,
  createApiError,
  createApiErrorFromErrorsList,
} from "./apiError.ts";

const {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNAUTHORIZED,
} = constants;

/* eslint-disable perfectionist/sort-objects */
export const commonErrorCodes = {
  GENERIC_ERROR: "9991",
  ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR: "9992",
  RESPONSE_SERIALIZATION_ERROR: "9993",
  MISSING_HEADER: "9994",
  FASTIFY_ERROR: "9995",
  UNAUTHORIZED: "9996",
  FORBIDDEN: "9997",
  INVALID_KEY_LENGTH: "9998",
  INVALID_PUBLIC_KEY: "9999",
  NOT_ALLOWED_MULTIPLE_KEYS: "10000",
  NOT_ALLOWED_PRIVATE_KEY: "10001",
  NOT_AN_RSA_KEY: "10002",
  NOT_FOUND: "10003",
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

export function forbiddenError(detail: string): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "FORBIDDEN",
    detail,
    status: HTTP_STATUS_FORBIDDEN,
    title: "Forbidden",
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

export function invalidKeyLength(
  actualLength: number | undefined,
  minLength = 2048,
) {
  return createApiError<CommonErrorCodes>({
    code: "INVALID_KEY_LENGTH",
    detail: `Invalid RSA key length: ${actualLength} bits. It must be at least ${minLength}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Key length",
  });
}

export function invalidPublicKey() {
  return createApiError<CommonErrorCodes>({
    code: "INVALID_PUBLIC_KEY",
    detail: "Public key is invalid",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Key",
  });
}

export function missingRequestHeader(
  headerName: string,
): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "MISSING_HEADER",
    detail: `Missing ${headerName} request header`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Request header has not been passed",
  });
}

export function missingResponseHeader(
  headerName: string,
): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "MISSING_HEADER",
    detail: `Missing ${headerName} response header`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Response header has not been passed",
  });
}

export function notAllowedMultipleKeys() {
  return createApiError<CommonErrorCodes>({
    code: "NOT_ALLOWED_MULTIPLE_KEYS",
    detail: "The received key contains multiple keys",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not allowed multiple keys",
  });
}

export function notAllowedPrivateKey() {
  return createApiError<CommonErrorCodes>({
    code: "NOT_ALLOWED_PRIVATE_KEY",
    detail: "The received key is a private key",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not allowed private key",
  });
}

export function notAnRSAKey() {
  return createApiError<CommonErrorCodes>({
    code: "NOT_AN_RSA_KEY",
    detail: "Provided key is not an RSA key",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Not an RSA key",
  });
}

export function notFoundError(detail: string): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "NOT_FOUND",
    detail,
    status: HTTP_STATUS_NOT_FOUND,
    title: "Not Found",
  });
}

export function responseSerializationError(
  error: ResponseSerializationError,
): ApiError<CommonErrorCodes> {
  const context = "response";
  const errors = error.cause.issues.map((issue) => {
    const path = toDotPath(issue.path);
    const fullPath = path ? `${context}.${path}` : context;
    return new Error(`${issue.message} at ${fullPath}`);
  });

  return createApiErrorFromErrorsList({
    code: "RESPONSE_SERIALIZATION_ERROR",
    errors,
    status: error.statusCode || HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "Response Serialization Error",
  });
}

export function unauthorizedError(detail: string): ApiError<CommonErrorCodes> {
  return createApiError({
    code: "UNAUTHORIZED",
    detail,
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "Unauthorized",
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
    return new Error(`${message} at ${fullPath}`);
  });

  return createApiErrorFromErrorsList({
    code: "ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR",
    errors,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Request Validation Error",
  });
}
