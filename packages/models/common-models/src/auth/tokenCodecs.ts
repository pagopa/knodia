import { KnodiaJwtSignatureSignedHeaders } from "@knodia/integrity-rest-02/models";
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

// E-service access tokens are consumed by external platforms that don't need
// to discriminate Knodia token types, so this codec deliberately omits the
// `type` literal carried by every other token codec in this file.
export const EserviceAccessTokenClaims = BaseJwtClaims.extend({
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

export const KnodiaJwtSignatureClaims = BaseJwtClaims.pick({
  exp: true,
  iat: true,
  iss: true,
  jti: true,
}).extend({
  client_id: ConsumerKeychainId.optional(),
  signed_headers: KnodiaJwtSignatureSignedHeaders,
});
export type KnodiaJwtSignatureClaims = z.infer<typeof KnodiaJwtSignatureClaims>;

export const KnodeApiAccessTokenClaims = BaseJwtClaims.extend({
  client_id: KnodeApiKeychainId,
  keychain: z.strictObject({ id: KnodeApiKeychainId, knode_id: KnodeId }),
  nbf: z.int(),
  organization: z.strictObject({ id: OrganizationId, knode_id: KnodeId }),
  sub: KnodeApiKeychainId,
  type: z.literal("knode-api"),
});
export type KnodeApiAccessTokenClaims = z.infer<
  typeof KnodeApiAccessTokenClaims
>;

export const UISessionTokenClaims = UserTokenClaims.extend({
  type: z.literal("ui-session"),
});
export type UISessionTokenClaims = z.infer<typeof UISessionTokenClaims>;

export const InternalTokenClaims = BaseJwtClaims.extend({
  type: z.literal("internal"),
});
export type InternalTokenClaims = z.infer<typeof InternalTokenClaims>;

export const UISignupSessionTokenClaims = BaseJwtClaims.extend({
  dateOfBirth: z.string(),
  familyName: z.string(),
  fiscalNumber: z.string().optional(),
  name: z.string(),
  oneIdNonce: z.string(),
  personIdentifier: z.string().optional(),
  spidCode: z.string().optional(),
  type: z.literal("ui-signup-session"),
});

export type UISignupSessionTokenClaims = z.infer<
  typeof UISignupSessionTokenClaims
>;

export const UISessionRefreshTokenClaims = UserTokenClaims.extend({
  type: z.literal("refresh-ui-session"),
});
export type UISessionRefreshTokenClaims = z.infer<
  typeof UISessionRefreshTokenClaims
>;

export const ExternalUISessionScope = z.enum(["agreement-activation"]);
export type ExternalUISessionScope = z.infer<typeof ExternalUISessionScope>;

const ExternalUISessionResourceClaims = BaseJwtClaims.extend({
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
    type: z.literal("external-ui-session"),
  });
export type ExternalUISessionTokenClaims = z.infer<
  typeof ExternalUISessionTokenClaims
>;

export const ExternalUISessionMagicLinkTokenClaims =
  ExternalUISessionResourceClaims.extend({
    type: z.literal("external-ui-session-magic-link"),
  });
export type ExternalUISessionMagicLinkTokenClaims = z.infer<
  typeof ExternalUISessionMagicLinkTokenClaims
>;

// Token types accepted as authentication credentials by API services.
// Does NOT include refresh tokens, which are only used for token renewal.
// that consumes Knode API access tokens lands.
export const KnodiaAuthTokenClaims = z.discriminatedUnion("type", [
  UISessionTokenClaims,
  InternalTokenClaims,
  ExternalUISessionTokenClaims,
  KnodeApiAccessTokenClaims,
  UISignupSessionTokenClaims,
]);
export type KnodiaAuthTokenClaims = z.infer<typeof KnodiaAuthTokenClaims>;
