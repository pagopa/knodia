import type { Algorithm } from "@knodia/common-models/algorithms";

import {
  type CommonErrorCodes,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const { HTTP_STATUS_BAD_REQUEST } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR: "0001",
  UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR: "0002",
  CLIENT_ASSERTION_EXPIRED: "0003",
  INVALID_CLIENT_ASSERTION_SIGNATURE: "0004",
  JSON_WEB_TOKEN_ERROR: "0005",
  PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG: "0006",
};
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = CommonErrorCodes | keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});

export function clientAssertionClaimsValidationError(
  consumerKeychainId: string,
  error: unknown,
) {
  const message =
    error instanceof ZodError
      ? fromZodError(error).message
      : error instanceof Error
        ? error.message
        : "Unknown error";

  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_CLAIMS_VALIDATION_ERROR",
    detail: `Client Assertion claims validation failed for Consumer Keychain ${consumerKeychainId}. Reasons: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Client Assertion claims validation error",
  });
}

export function clientAssertionExpired() {
  return createApiError<ErrorCodes>({
    code: "CLIENT_ASSERTION_EXPIRED",
    detail: "The Client Assertion has expired",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Client Assertion expired",
  });
}

export function invalidClientAssertionSignature() {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_SIGNATURE",
    detail: "The Client Assertion signature is invalid",
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid Client Assertion signature",
  });
}

export function jsonWebTokenError(message: string) {
  return createApiError<ErrorCodes>({
    code: "JSON_WEB_TOKEN_ERROR",
    detail: `Invalid JWT format in Client Assertion signature verification. Reason: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "JSON Web Token error",
  });
}

export function publicKeyAlgNotMatchingClientAssertionAlg(
  publicKeyAlg: string,
  clientAssertionAlg: Algorithm,
) {
  return createApiError<ErrorCodes>({
    code: "PUBLIC_KEY_ALG_NOT_MATCHING_CLIENT_ASSERTION_ALG",
    detail: `The Public Key algorithm (${publicKeyAlg}) does not match the Client Assertion algorithm (${clientAssertionAlg})`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Public Key algorithm does not match Client Assertion algorithm",
  });
}

export function unexpectedClientAssertionSignatureVerificationError(
  error: unknown,
) {
  const message = error instanceof Error ? error.message : "Unknown error";

  return createApiError<ErrorCodes>({
    code: "UNEXPECTED_CLIENT_ASSERTION_SIGNATURE_VERIFICATION_ERROR",
    detail: `An unexpected error occurred during Client Assertion signature verification: ${message}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Unexpected error during Client Assertion signature verification",
  });
}
