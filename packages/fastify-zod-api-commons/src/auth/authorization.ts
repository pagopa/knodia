import type { RequestContextData } from "@fastify/request-context";
import type {
  ExternalUISessionScope,
  UserRole,
} from "@knodia/common-models/auth";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { match } from "ts-pattern";

import type { AuthorizedContext } from "../context/context.ts";
import type {
  AuthData,
  ExternalUISessionAuthData,
  InternalAuthData,
  KnodeApiAuthData,
  UISessionAuthData,
} from "./authData.ts";

import { forbiddenError, unauthorizedError } from "../models/errors/errors.ts";

type AllowedAuthData<Rules extends readonly AuthorizationRule[]> =
  // If there's a rule with tokenType "external-ui-session", add ExternalUISessionAuthData
  | (Extract<Rules[number], { tokenType: "external-ui-session" }> extends never
      ? never
      : ExternalUISessionAuthData)
  // If there's a rule with tokenType "internal", add InternalAuthData
  | (Extract<Rules[number], { tokenType: "internal" }> extends never
      ? never
      : InternalAuthData)
  // If there's a rule with tokenType "knode-api", add KnodeApiAuthData
  | (Extract<Rules[number], { tokenType: "knode-api" }> extends never
      ? never
      : KnodeApiAuthData)
  // If there's a rule with tokenType "ui-session", add UISessionAuthData
  | (Extract<Rules[number], { tokenType: "ui-session" }> extends never
      ? never
      : UISessionAuthData);

type AuthorizationRule =
  | { scope: ExternalUISessionScope; tokenType: "external-ui-session" }
  | { tokenType: "internal" }
  | { tokenType: "knode-api" }
  | { tokenType: "ui-session"; userRoles: NonEmptyArray<UserRole> }
  | { tokenType: "ui-signup-session" };

/**
  ---- EXAMPLE USAGE: ----
  const ctx = validateAuthorization(getContextValues(requestContext), [
    { tokenType: "ui-session", userRoles: ["administrative", "technical"] },
  ]);
  // ^ It will throw a forbiddenError if the request does not have a ui-session token
  // with at least one of the roles "administrative" or "technical".
  // If the function succeeds, ctx.authData is narrowed to UISessionAuthData.

  const userId = ctx.authData.userId;
      // ^ compiles, because userId is present in UISessionAuthData
  const tokenType = ctx.authData.tokenType;
      // ^ TS refines this to "ui-session"

  ---- MIXED RULES EXAMPLE: ----
  const ctx = validateAuthorization(getContextValues(requestContext), [
    { tokenType: "internal" },
    { tokenType: "ui-session", userRoles: ["administrative"] },
  ]);
  // ^ ctx.authData is narrowed to InternalAuthData | UISessionAuthData

  const tokenType = ctx.authData.tokenType;
      // ^ TS refines this to "internal" | "ui-session"
  const userId = ctx.authData.userId;
      // ^ TS error: userId is not present in InternalAuthData
  -------------------------------------------------------
 */
export function validateAuthorization<
  const Rules extends NonEmptyArray<AuthorizationRule>,
>(
  ctx: RequestContextData,
  admittedRules: Rules,
): AuthorizedContext<AllowedAuthData<Rules>> {
  const { authData } = ctx;

  if (authData === undefined) {
    throw unauthorizedError("No authorization data available");
  }

  assertAuthDataAdmitted(authData, admittedRules);

  return {
    authData,
    correlationId: ctx.correlationId,
    logger: ctx.logger,
  };
}

function assertAuthDataAdmitted<
  const Rules extends NonEmptyArray<AuthorizationRule>,
>(
  authData: AuthData,
  admittedRules: Rules,
): asserts authData is AllowedAuthData<Rules> {
  match(authData)
    .with({ tokenType: "internal" }, () =>
      assertInternalTokenAdmitted(admittedRules),
    )
    .with({ tokenType: "ui-session" }, (data) =>
      assertUISessionTokenAdmitted(data, admittedRules),
    )
    .with({ tokenType: "external-ui-session" }, (data) =>
      assertExternalUISessionTokenAdmitted(data, admittedRules),
    )
    .with({ tokenType: "knode-api" }, () =>
      assertKnodeApiTokenAdmitted(admittedRules),
    )
    .with({ tokenType: "ui-signup-session" }, () =>
      assertUISignupSessionTokenAdmitted(admittedRules),
    )
    .exhaustive();
}

function assertExternalUISessionTokenAdmitted(
  authData: ExternalUISessionAuthData,
  admittedRules: NonEmptyArray<AuthorizationRule>,
): void {
  const externalRule = admittedRules.find(
    (
      rule,
    ): rule is Extract<
      AuthorizationRule,
      { tokenType: "external-ui-session" }
    > => rule.tokenType === "external-ui-session",
  );

  if (externalRule === undefined) {
    throw forbiddenError(
      `Invalid token type "external-ui-session" for this operation`,
    );
  }

  if (authData.scope !== externalRule.scope) {
    throw forbiddenError(
      `Invalid scope "${authData.scope}" for this operation, expected "${externalRule.scope}"`,
    );
  }
}

function assertInternalTokenAdmitted(
  admittedRules: NonEmptyArray<AuthorizationRule>,
): void {
  if (!admittedRules.some((rule) => rule.tokenType === "internal")) {
    throw forbiddenError(`Invalid token type "internal" for this operation`);
  }
}

function assertKnodeApiTokenAdmitted(
  admittedRules: NonEmptyArray<AuthorizationRule>,
): void {
  if (!admittedRules.some((rule) => rule.tokenType === "knode-api")) {
    throw forbiddenError(`Invalid token type "knode-api" for this operation`);
  }
}

function assertUISessionTokenAdmitted(
  authData: UISessionAuthData,
  admittedRules: NonEmptyArray<AuthorizationRule>,
): void {
  const uiSessionRule = admittedRules.find(
    (rule): rule is Extract<AuthorizationRule, { tokenType: "ui-session" }> =>
      rule.tokenType === "ui-session",
  );

  if (uiSessionRule === undefined) {
    throw forbiddenError(`Invalid token type "ui-session" for this operation`);
  }

  if (
    !authData.userRoles.some((role) => uiSessionRule.userRoles.includes(role))
  ) {
    throw forbiddenError(
      `Invalid roles ${JSON.stringify(authData.userRoles)} for this operation`,
    );
  }
}

function assertUISignupSessionTokenAdmitted(
  admittedRules: NonEmptyArray<AuthorizationRule>,
): void {
  if (!admittedRules.some((rule) => rule.tokenType === "ui-signup-session")) {
    throw forbiddenError(
      `Invalid token type "ui-signup-session" for this operation`,
    );
  }
}
