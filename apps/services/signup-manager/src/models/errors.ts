import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";
import { constants } from "http2";

const { HTTP_STATUS_CONFLICT, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND } =
  constants;

/* eslint-disable perfectionist/sort-objects */
const errorCodes = {
  SIGNUP_USER_EMAIL_ALREADY_IN_USE: "0001",
  SIGNUP_USER_IDENTIFIER_ALREADY_ASSOCIATED: "0002",
  SIGNUP_USER_GENERATED_ENTITIES_ALREADY_EXIST: "0003",
  SIGNUP_USER_ALREADY_HAS_PENDING_EMAIL_CHANGE_REQUEST: "0004",
  SIGNUP_USER_NOT_ONBOARDED: "0005",
  SIGNUP_USER_EMAIL_CHANGE_REQUEST_CREATION_CONFLICT: "0006",
  SIGNUP_USER_NOT_FOUND: "0007",
  SIGNUP_USER_NOT_ACTIVE: "0008",
  SIGNUP_USER_NOT_SUSPENDED: "0009",
  SIGNUP_USER_EMAIL_DOMAIN_NOT_ALLOWED: "0010",
} as const;
/* eslint-enable perfectionist/sort-objects */

type ErrorCodes = keyof typeof errorCodes;

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  serviceName: "signup-manager",
});

export function signupUserAlreadyHasPendingEmailChangeRequest() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_ALREADY_HAS_PENDING_EMAIL_CHANGE_REQUEST",
    detail: "Signup user already has a pending email change request",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Already Has Pending Email Change Request",
  });
}

export function signupUserEmailAlreadyInUse(email: string) {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_EMAIL_ALREADY_IN_USE",
    detail: `Email ${email} is already in use with an onboarded user`,
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Email Already In Use",
  });
}

export function signupUserEmailChangeRequestCreationConflict() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_EMAIL_CHANGE_REQUEST_CREATION_CONFLICT",
    detail:
      "Email change request could not be created because related data changed concurrently. Please retry the email change request",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Email Change Request Creation Conflict",
  });
}

// Generic title/detail: there's no real benefit in revealing that the rejection
// is domain-based. The dedicated code is for server-side observability.
export function signupUserEmailDomainNotAllowed() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_EMAIL_DOMAIN_NOT_ALLOWED",
    detail: "The request cannot be completed",
    status: HTTP_STATUS_FORBIDDEN,
    title: "Forbidden",
  });
}

export function signupUserGeneratedEntitiesAlreadyExist() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_GENERATED_ENTITIES_ALREADY_EXIST",
    detail:
      "Generated signup entities exist already and are associated with another onboarded user. Please retry the onboarding confirmation",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Generated Entities Already Exist",
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

export function signupUserNotActive() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_NOT_ACTIVE",
    detail: "Signup user is not active",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Not Active",
  });
}

export function signupUserNotFound() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_NOT_FOUND",
    detail: "No onboarded signup user matches the caller identifier claims",
    status: HTTP_STATUS_NOT_FOUND,
    title: "Signup User Not Found",
  });
}

export function signupUserNotOnboarded() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_NOT_ONBOARDED",
    detail: "Signup user has not completed onboarding",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Not Onboarded",
  });
}

export function signupUserNotSuspended() {
  return createApiError<ErrorCodes>({
    code: "SIGNUP_USER_NOT_SUSPENDED",
    detail: "Signup user is not suspended",
    status: HTTP_STATUS_CONFLICT,
    title: "Signup User Not Suspended",
  });
}
