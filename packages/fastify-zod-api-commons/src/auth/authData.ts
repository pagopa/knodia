import type { OrganizationId, UserId } from "@knodia/common-models/ids";
import type { TokenClaims } from "@knodia/common-models/tokenCodecs";
import type z from "zod";

import { match } from "ts-pattern";

// Future union member: | InternalAuthData
export type AuthData = SessionAuthData;

export interface SessionAuthData {
  organizationId: OrganizationId;
  tokenType: "session";
  userId: UserId;
  userRoles: string[];
}

export type TokenClaims = z.infer<typeof TokenClaims>;

export function extractAuthData(claims: TokenClaims): AuthData {
  return match(claims)
    .with(
      { tokenType: "session" },
      (c): SessionAuthData => ({
        organizationId: c.organizationId,
        tokenType: "session",
        userId: c.sub,
        userRoles: c.role,
      }),
    )
    .exhaustive();
}
