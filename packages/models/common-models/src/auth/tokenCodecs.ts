import { match, P } from "ts-pattern";
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
import { exactlyOneDefined } from "../utils.ts";
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
  // Reject empty strings: "present" to the exactly-one refine but absent to the
  // truthiness-based DB lookup.
  fiscalNumber: z.string().min(1).optional(),
  name: z.string(),
  oneIdNonce: z.string(),
  personIdentifier: z.string().min(1).optional(),
  spidCode: z.string().min(1).optional(),
  type: z.literal("ui-signup-session"),
}).refine(
  (c) => exactlyOneDefined(c.spidCode, c.fiscalNumber, c.personIdentifier),
  {
    message:
      "exactly one of spidCode / fiscalNumber / personIdentifier must be set",
    path: ["spidCode"],
  },
);

export interface SignupIdentifier {
  field: "fiscalNumber" | "personIdentifier" | "spidCode";
  value: string;
}

export type UISignupSessionTokenClaims = z.infer<
  typeof UISignupSessionTokenClaims
>;

// Precedence: personIdentifier > spidCode > fiscalNumber.
export function selectSignupIdentifier(ids: {
  fiscalNumber?: string;
  personIdentifier?: string;
  spidCode?: string;
}): SignupIdentifier | undefined {
  return match(ids)
    .with({ personIdentifier: P.string }, ({ personIdentifier }) => ({
      field: "personIdentifier" as const,
      value: personIdentifier,
    }))
    .with({ spidCode: P.string }, ({ spidCode }) => ({
      field: "spidCode" as const,
      value: spidCode,
    }))
    .with({ fiscalNumber: P.string }, ({ fiscalNumber }) => ({
      field: "fiscalNumber" as const,
      value: fiscalNumber,
    }))
    .otherwise(() => undefined);
}

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
// TODO: include KnodeApiAccessTokenClaims once the signal-hub auth plugin
// that consumes Knode API access tokens lands.
export const KnodiaAuthTokenClaims = z.discriminatedUnion("type", [
  UISessionTokenClaims,
  InternalTokenClaims,
  ExternalUISessionTokenClaims,
  KnodeApiAccessTokenClaims,
  UISignupSessionTokenClaims,
]);
export type KnodiaAuthTokenClaims = z.infer<typeof KnodiaAuthTokenClaims>;
