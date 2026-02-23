import z from "zod";

import { OrganizationId, UserId } from "../brandedIds.ts";
import { NonEmptyArray } from "../types.ts";
import { UserRole } from "./roles.ts";

const BaseJwtClaims = z.object({
  aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number().int(),
  iat: z.number().int(),
  iss: z.string(),
  jti: z.string(),
  sub: UserId,
});

export const UISessionTokenClaims = BaseJwtClaims.extend({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  type: z.literal("ui-session"),
});
export type UISessionTokenClaims = z.infer<typeof UISessionTokenClaims>;

// Future token types (e.g. z.literal("internal")) can be added to this union
export const KnodiaTokenClaims = z.discriminatedUnion("type", [
  UISessionTokenClaims,
]);
export type KnodiaTokenClaims = z.infer<typeof KnodiaTokenClaims>;
