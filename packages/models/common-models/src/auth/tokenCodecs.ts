import z from "zod";

import { ExternalId } from "../externalResource.ts";
import {
  AgreementId,
  ConsumerKeychainId,
  EserviceId,
  EserviceVersionId,
  KnodeApiKeychainId,
  OrganizationId,
  PurposeId,
} from "../ids/brandedIds.ts";
import { KnodeId } from "../ids/ids.ts";
import { UserId } from "../ids/userId.ts";
import { NonEmptyArray } from "../types.ts";
import { UserRole } from "./roles.ts";

export const JwtType = z.enum([
  "eservice-access",
  "external-ui-session",
  "external-ui-session-magic-link",
  "internal",
  "knode-api",
  "refresh-ui-session",
  "ui-session",
  "ui-signup-session",
  "knodia-jwt-signature",
]);
export type JwtType = z.infer<typeof JwtType>;

export const BaseJwtClaims = z.object({
  exp: z.number().int(),
  iat: z.number().int(),
  iss: z.string(),
  jti: z.string(),
  type: JwtType,
});
export type BaseJwtClaims = z.infer<typeof BaseJwtClaims>;

const KnodiaJwtClaims = BaseJwtClaims.extend({
  aud: z.union([z.string(), z.array(z.string())]),
  sub: z.string(),
});

const UserTokenClaims = KnodiaJwtClaims.extend({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  sub: UserId,
  username: z.string(),
});

// E-service access tokens are consumed by external platforms that don't need
// to discriminate Knodia token types, so this codec deliberately omits the
// `type` literal carried by every other token codec in this file.
export const EserviceAccessTokenClaims = KnodiaJwtClaims.extend({
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
  type: z.literal(JwtType.enum["eservice-access"]),
});
export type EserviceAccessTokenClaims = z.infer<
  typeof EserviceAccessTokenClaims
>;

export const KnodeApiAccessTokenClaims = KnodiaJwtClaims.extend({
  client_id: KnodeApiKeychainId,
  keychain: z.strictObject({ id: KnodeApiKeychainId, knode_id: KnodeId }),
  nbf: z.int(),
  organization: z.strictObject({ id: OrganizationId, knode_id: KnodeId }),
  sub: KnodeApiKeychainId,
  type: z.literal(JwtType.enum["knode-api"]),
});
export type KnodeApiAccessTokenClaims = z.infer<
  typeof KnodeApiAccessTokenClaims
>;

export const UISessionTokenClaims = UserTokenClaims.extend({
  type: z.literal(JwtType.enum["ui-session"]),
});
export type UISessionTokenClaims = z.infer<typeof UISessionTokenClaims>;

export const InternalTokenClaims = KnodiaJwtClaims.extend({
  type: z.literal(JwtType.enum["internal"]),
});
export type InternalTokenClaims = z.infer<typeof InternalTokenClaims>;

export const UISignupSessionTokenClaims = KnodiaJwtClaims.extend({
  dateOfBirth: z.string(),
  familyName: z.string(),
  fiscalNumber: z.string().optional(),
  name: z.string(),
  oneIdNonce: z.string(),
  personIdentifier: z.string().optional(),
  spidCode: z.string().optional(),
  type: z.literal(JwtType.enum["ui-signup-session"]),
});

export type UISignupSessionTokenClaims = z.infer<
  typeof UISignupSessionTokenClaims
>;

export const UISessionRefreshTokenClaims = UserTokenClaims.extend({
  type: z.literal(JwtType.enum["refresh-ui-session"]),
});
export type UISessionRefreshTokenClaims = z.infer<
  typeof UISessionRefreshTokenClaims
>;

export const ExternalUISessionScope = z.enum(["agreement-activation"]);
export type ExternalUISessionScope = z.infer<typeof ExternalUISessionScope>;

const ExternalUISessionResourceClaims = KnodiaJwtClaims.extend({
  agreement: z.strictObject({ id: AgreementId, knode_id: KnodeId }),
  consumer: z.strictObject({
    id: ExternalId<OrganizationId>(),
    knode_id: KnodeId,
  }),
  eservice: z.strictObject({
    id: EserviceId,
    knode_id: KnodeId,
    version: EserviceVersionId,
  }),
  producer: z.strictObject({ id: OrganizationId, knode_id: KnodeId }),
  scope: ExternalUISessionScope,
});

export const ExternalUISessionTokenClaims =
  ExternalUISessionResourceClaims.extend({
    type: z.literal(JwtType.enum["external-ui-session"]),
  });
export type ExternalUISessionTokenClaims = z.infer<
  typeof ExternalUISessionTokenClaims
>;

export const ExternalUISessionMagicLinkTokenClaims =
  ExternalUISessionResourceClaims.extend({
    type: z.literal(JwtType.enum["external-ui-session-magic-link"]),
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
  KnodeApiAccessTokenClaims,
  UISignupSessionTokenClaims,
]);
export type KnodiaAuthTokenClaims = z.infer<typeof KnodiaAuthTokenClaims>;
