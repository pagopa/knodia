import z from "zod";

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
