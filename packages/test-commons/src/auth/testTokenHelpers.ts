import { ExternalUISessionScope, UserRole } from "@knodia/common-models/auth";
import { match, P } from "ts-pattern";

import type { TestToken } from "./auth.ts";

/**
 * All atomic test tokens: one per role + internal + one per external-ui-session
 * scope. Derived from the `UserRole` and `ExternalUISessionScope` enums so new
 * roles or scopes are automatically covered.
 */
const allTestTokens: TestToken[] = [
  { type: "internal" },
  ...UserRole.options.map(
    (role): TestToken => ({ roles: [role], type: "ui-session" }),
  ),
  ...ExternalUISessionScope.options.map(
    (scope): TestToken => ({ scope, type: "external-ui-session" }),
  ),
];

const isAllowed = (token: TestToken, allowed: TestToken[]): boolean =>
  allowed.some((a) =>
    match([token, a])
      .with([{ type: "internal" }, { type: "internal" }], () => true)
      .with(
        [
          { roles: P.array(), type: "ui-session" },
          { roles: P.array(), type: "ui-session" },
        ],
        ([t, a]) => t.roles.every((r) => a.roles.includes(r)),
      )
      .with(
        [{ type: "external-ui-session" }, { type: "external-ui-session" }],
        ([t, a]) => t.scope === a.scope,
      )
      .otherwise(() => false),
  );

export function forbiddenTestTokens(allowed: TestToken[]): TestToken[] {
  return allTestTokens.filter((token) => !isAllowed(token, allowed));
}
