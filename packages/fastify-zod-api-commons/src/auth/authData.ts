import type {
  KnodiaAuthTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { match } from "ts-pattern";

export type AuthData =
  | ExternalUISessionAuthData
  | InternalAuthData
  | UISessionAuthData;

export interface ExternalUISessionAuthData {
  agreementId: AgreementId;
  consumerId: ExternalId<OrganizationId>;
  consumerKnodeId: KnodeId;
  eserviceId: EserviceId;
  eserviceVersionId: EserviceVersionId;
  producerId: OrganizationId;
  scope: string;
  tokenType: "external-ui-session";
}

export interface InternalAuthData {
  tokenType: "internal";
}

export interface UISessionAuthData {
  organizationId: OrganizationId;
  tokenType: "ui-session";
  userId: UserId;
  userRoles: NonEmptyArray<UserRole>;
}

export function extractAuthDataFromToken(
  claims: KnodiaAuthTokenClaims,
): AuthData {
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
    .with(
      { type: "internal" },
      (): InternalAuthData => ({
        tokenType: "internal",
      }),
    )
    .with(
      { type: "external-ui-session" },
      (c): ExternalUISessionAuthData => ({
        agreementId: c.agreementId,
        consumerId: c.consumerId,
        consumerKnodeId: c.consumerKnodeId,
        eserviceId: c.eserviceId,
        eserviceVersionId: c.eserviceVersionId,
        producerId: c.producerId,
        scope: c.scope,
        tokenType: "external-ui-session",
      }),
    )
    .exhaustive();
}
