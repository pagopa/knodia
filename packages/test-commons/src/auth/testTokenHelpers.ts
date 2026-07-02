import { ExternalUISessionScope, UserRole } from "@knodia/common-models/auth";
import { match, P } from "ts-pattern";

import type { TestToken } from "./auth.ts";

/**
 * All atomic test tokens, keyed by token type. The mapped type forces an entry
 * for every `TestToken` type — a new token type won't compile until it's added
 * here — and each value must hold tokens of exactly its key's type.
 * `ui-session` and `external-ui-session` are expanded per role/scope from their
 * enums so new roles or scopes are automatically covered.
 */
const testTokensByType: {
  [K in TestToken["type"]]: Extract<TestToken, { type: K }>[];
} = {
  "external-ui-session": ExternalUISessionScope.options.map((scope) => ({
    scope,
    type: "external-ui-session",
  })),
  internal: [{ type: "internal" }],
  "knode-api": [{ type: "knode-api" }],
  maintenance: [{ type: "maintenance" }],
  "ui-session": UserRole.options.map((role) => ({
    roles: [role],
    type: "ui-session",
  })),
  "ui-signup-session": [
    { oneIdNonce: "test-nonce", type: "ui-signup-session" },
  ],
};

const allTestTokens: TestToken[] = Object.values(testTokensByType).flat();

const isAllowed = (token: TestToken, allowed: TestToken[]): boolean =>
  allowed.some((a) =>
    match([token, a])
      .with([{ type: "internal" }, { type: "internal" }], () => true)
      .with([{ type: "maintenance" }, { type: "maintenance" }], () => true)
      .with([{ type: "knode-api" }, { type: "knode-api" }], () => true)
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
      .with(
        [{ type: "ui-signup-session" }, { type: "ui-signup-session" }],
        () => true,
      )
      .otherwise(() => false),
  );

export function forbiddenTestTokens(allowed: TestToken[]): TestToken[] {
  return allTestTokens.filter((token) => !isAllowed(token, allowed));
}
