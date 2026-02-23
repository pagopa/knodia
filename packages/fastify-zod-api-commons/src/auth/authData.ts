import type { KnodiaTokenClaims, UserRole } from "@knodia/common-models/auth";
import type { OrganizationId, UserId } from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { match } from "ts-pattern";

// Future union member: | InternalAuthData
export type AuthData = UISessionAuthData;

export interface UISessionAuthData {
  organizationId: OrganizationId;
  tokenType: "ui-session";
  userId: UserId;
  userRoles: NonEmptyArray<UserRole>;
}

export function extractAuthDataFromToken(claims: KnodiaTokenClaims): AuthData {
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
    .exhaustive();
}
