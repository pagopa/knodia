import { UserRole } from "@knodia/common-models/auth";
import { match, P } from "ts-pattern";

import type { TestToken } from "./auth.ts";

/**
 * All atomic test tokens: one per role + internal.
 * Derived from the `UserRole` enum so new roles are automatically covered.
 */
export const allTestTokens: TestToken[] = [
  { type: "internal" },
  ...UserRole.options.map(
    (role): TestToken => ({ roles: [role], type: "ui-session" }),
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
      .otherwise(() => false),
  );

export function forbiddenTestTokens(allowed: TestToken[]): TestToken[] {
  return allTestTokens.filter((token) => !isAllowed(token, allowed));
}
