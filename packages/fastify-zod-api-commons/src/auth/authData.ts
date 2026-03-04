import type {
  KnodiaAuthTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { OrganizationId, UserId } from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { match } from "ts-pattern";

export type AuthData = InternalAuthData | UISessionAuthData;

export interface InternalAuthData {
  tokenType: "internal";
}

export interface UISessionAuthData {
  organizationId: OrganizationId;
  tokenType: "ui-session";
  userId: UserId;
  userRoles: NonEmptyArray<UserRole>;
}

export function extractAuthDataFromToken(
  claims: KnodiaAuthTokenClaims,
): AuthData {
  return match(claims)
    .with(
      { type: "ui-session" },
      (c): UISessionAuthData => ({
        organizationId: c.organizationId,
        tokenType: "ui-session",
        userId: c.sub,
        userRoles: c.roles,
      }),
    )
    .with(
      { type: "internal" },
      (): InternalAuthData => ({
        tokenType: "internal",
      }),
    )
    .exhaustive();
}
