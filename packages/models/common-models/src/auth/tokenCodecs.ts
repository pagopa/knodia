import z from "zod";

import { ExternalId } from "../externalResource.ts";
import {
  ConsumerKeychainId,
  EserviceId,
  EserviceVersionId,
  OrganizationId,
  PurposeId,
} from "../ids/brandedIds.ts";
import { KnodeId } from "../ids/ids.ts";
import { UserId } from "../ids/userId.ts";
import { NonEmptyArray } from "../types.ts";
import { UserRole } from "./roles.ts";

const BaseJwtClaims = z.object({
  aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number().int(),
  iat: z.number().int(),
  iss: z.string(),
  jti: z.string(),
  sub: z.string(),
});

const UserTokenClaims = BaseJwtClaims.extend({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  sub: UserId,
  username: z.string(),
});

const EserviceAccessTokenClaims = BaseJwtClaims.extend({
  client_id: ConsumerKeychainId,
  cnf: z.strictObject({ jkt: z.string() }).optional(),
  consumer: z.strictObject({
    id: ExternalId<OrganizationId>(),
    knode_id: KnodeId,
  }),
  eservice: z.strictObject({
    id: EserviceId,
    knode_id: KnodeId,
    version: EserviceVersionId,
  }),
  nbf: z.int(),
  producer: z.strictObject({ id: OrganizationId, knode_id: KnodeId }),
  purpose: z.strictObject({ id: PurposeId, knode_id: KnodeId }),
  sub: ConsumerKeychainId,
});
export type EserviceAccessTokenClaims = z.infer<
  typeof EserviceAccessTokenClaims
>;

export const UISessionTokenClaims = UserTokenClaims.extend({
  type: z.literal("ui-session"),
});
export type UISessionTokenClaims = z.infer<typeof UISessionTokenClaims>;

export const InternalTokenClaims = BaseJwtClaims.extend({
  type: z.literal("internal"),
});
export type InternalTokenClaims = z.infer<typeof InternalTokenClaims>;

export const UISessionRefreshTokenClaims = UserTokenClaims.extend({
  type: z.literal("refresh-ui-session"),
});
export type UISessionRefreshTokenClaims = z.infer<
  typeof UISessionRefreshTokenClaims
>;

// Token types accepted as authentication credentials by API services.
// Does NOT include refresh tokens, which are only used for token renewal.
export const KnodiaAuthTokenClaims = z.discriminatedUnion("type", [
  UISessionTokenClaims,
  InternalTokenClaims,
]);
export type KnodiaAuthTokenClaims = z.infer<typeof KnodiaAuthTokenClaims>;
