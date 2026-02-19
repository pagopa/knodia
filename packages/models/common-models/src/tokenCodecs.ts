import { match } from "ts-pattern";
import z from "zod";

import type { OrganizationId, UserId } from "./brandedIds.ts";

import {
  OrganizationId as OrganizationIdSchema,
  UserId as UserIdSchema,
} from "./brandedIds.ts";

const BaseJwtClaims = z.object({
  aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number().int(),
  iat: z.number().int(),
  iss: z.string(),
  jti: z.string(),
  sub: UserIdSchema,
});

const SessionTokenClaims = BaseJwtClaims.extend({
  organizationId: OrganizationIdSchema,
  role: z.array(z.string()),
  tokenType: z.literal("session"),
});

// Future token types (e.g. z.literal("internal")) can be added to this union
export const TokenClaims = z.discriminatedUnion("tokenType", [
  SessionTokenClaims,
]);
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
