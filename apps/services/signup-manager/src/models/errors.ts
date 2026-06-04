import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT } = constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  SIGNUP_USER_EMAIL_ALREADY_ASSOCIATED: "0001",
  SIGNUP_USER_IDENTIFIER_ALREADY_ASSOCIATED: "0002",
  SIGNUP_USER_GENERATED_ENTITIES_ALREADY_TAKEN: "0003",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "signup-manager",
});

export function signupUserEmailAlreadyAssociated(email: string) {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_EMAIL_ALREADY_ASSOCIATED",
    detail: `Email ${email} is already associated with an onboarded user`,
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Email Already Associated",
  });
}

export function signupUserGeneratedEntitiesAlreadyTaken() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_GENERATED_ENTITIES_ALREADY_TAKEN",
    detail:
      "Generated signup entities are already associated with another onboarded user. Please retry the onboarding confirmation",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Generated Entities Already Taken",
  });
}

export function signupUserIdentifierAlreadyAssociated() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_IDENTIFIER_ALREADY_ASSOCIATED",
    detail:
      "At least one user identifier is already associated with an onboarded user",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Identifier Already Associated",
  });
}
