import z from "zod";

import { ExternalId } from "../externalResource.ts";
import {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  OrganizationId,
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

export const ExternalUISessionScope = z.enum(["agreement-activation"]);
export type ExternalUISessionScope = z.infer<typeof ExternalUISessionScope>;

export const ExternalUISessionTokenClaims = BaseJwtClaims.extend({
  agreementId: AgreementId,
  consumerId: ExternalId<OrganizationId>(),
  consumerKnodeId: KnodeId,
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  producerId: OrganizationId,
  scope: ExternalUISessionScope,
  type: z.literal("external-ui-session"),
});
export type ExternalUISessionTokenClaims = z.infer<
  typeof ExternalUISessionTokenClaims
>;

export const ExternalUISessionMagicLinkTokenClaims = BaseJwtClaims.extend({
  agreementId: AgreementId,
  consumerId: ExternalId<OrganizationId>(),
  consumerKnodeId: KnodeId,
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  producerId: OrganizationId,
  scope: ExternalUISessionScope,
  type: z.literal("external-ui-session-magic-link"),
});
export type ExternalUISessionMagicLinkTokenClaims = z.infer<
  typeof ExternalUISessionMagicLinkTokenClaims
>;

// Token types accepted as authentication credentials by API services.
// Does NOT include refresh tokens, which are only used for token renewal.
export const KnodiaAuthTokenClaims = z.discriminatedUnion("type", [
  UISessionTokenClaims,
  InternalTokenClaims,
  ExternalUISessionTokenClaims,
]);
export type KnodiaAuthTokenClaims = z.infer<typeof KnodiaAuthTokenClaims>;
