import type { RequestContextData } from "@fastify/request-context";
import type { UserRole } from "@knodia/common-models/auth";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { match } from "ts-pattern";

import type { AppContext } from "../context/context.ts";
import type {
  AuthData,
  InternalAuthData,
  UISessionAuthData,
} from "./authData.ts";

import { forbiddenError, unauthorizedError } from "../models/errors/errors.ts";

export type AuthorizationRule =
  | { tokenType: "internal" }
  | { tokenType: "ui-session"; userRoles: NonEmptyArray<UserRole> };

type AllowedAuthData<Rules extends readonly AuthorizationRule[]> =
  | (Extract<Rules[number], { tokenType: "internal" }> extends never
      ? never
      : InternalAuthData)
  | (Extract<Rules[number], { tokenType: "ui-session" }> extends never
      ? never
      : UISessionAuthData);

export function validateAuthorization<
  const Rules extends NonEmptyArray<AuthorizationRule>,
>(
  ctx: RequestContextData,
  admittedRules: Rules,
): AppContext<AllowedAuthData<Rules>> {
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
    .exhaustive();
}

function assertInternalTokenAdmitted(
  admittedRules: NonEmptyArray<AuthorizationRule>,
): void {
  if (!admittedRules.some((rule) => rule.tokenType === "internal")) {
    throw forbiddenError(`Invalid token type "internal" for this operation`);
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
