import {
  type ApiError,
  createApiError,
} from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

import {
  EXPECTED_CLIENT_ASSERTION_TYPE,
  EXPECTED_GRANT_TYPE,
} from "./constants.ts";

const { HTTP_STATUS_BAD_REQUEST } = constants;

const errorCodes = {
  INVALID_CLIENT_ASSERTION_TYPE: "0001",
  INVALID_GRANT_TYPE: "0002",
  TOKEN_REQUEST_VALIDATION_ERROR: "0003",
};

export type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "authorization-server",
});

export function invalidClientAssertionType(clientAssertionType: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_CLIENT_ASSERTION_TYPE",
    detail: `Request client_assertion_type ${clientAssertionType} does not match expected ${EXPECTED_CLIENT_ASSERTION_TYPE}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid client_assertion_type",
  });
}

export function invalidGrantType(grantType: string) {
  return createApiError<ErrorCodes>({
    code: "INVALID_GRANT_TYPE",
    detail: `Request grant_type ${grantType} does not match expected ${EXPECTED_GRANT_TYPE}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Invalid grant_type",
  });
}

export function tokenRequestValidationError(
  consumerKeychainId: string | undefined,
  validationErrors: ApiError<ErrorCodes>[],
) {
  return createApiError<ErrorCodes>({
    code: "TOKEN_REQUEST_VALIDATION_ERROR",
    detail: `Token request validation failed for consumer keychain ${consumerKeychainId}: ${validationErrors}`,
    status: HTTP_STATUS_BAD_REQUEST,
    title: "Token request validation error",
  });
}
