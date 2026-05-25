import type {
  ExternalUISessionScope,
  KnodiaAuthTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  AgreementId,
  EserviceId,
  EserviceVersionId,
  KnodeApiKeychainId,
  KnodeId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";
import type { NonEmptyArray } from "@knodia/common-models/types";

import { match } from "ts-pattern";

export type AuthData =
  | ExternalUISessionAuthData
  | InternalAuthData
  | KnodeApiAuthData
  | UISessionAuthData
  | UISignupSessionAuthData;

export interface ExternalUISessionAuthData {
  agreement: {
    id: AgreementId;
    knodeId: KnodeId;
  };
  consumer: {
    id: ExternalId<OrganizationId>;
    knodeId: KnodeId;
  };
  eservice: {
    id: EserviceId;
    knodeId: KnodeId;
    version: EserviceVersionId;
  };
  producer: {
    id: OrganizationId;
    knodeId: KnodeId;
  };
  scope: ExternalUISessionScope;
  tokenType: "external-ui-session";
}

export interface InternalAuthData {
  tokenType: "internal";
}

export interface KnodeApiAuthData {
  keychain: {
    id: KnodeApiKeychainId;
    knodeId: KnodeId;
  };
  organization: {
    id: OrganizationId;
    knodeId: KnodeId;
  };
  tokenType: "knode-api";
}

export interface UISessionAuthData {
  organizationId: OrganizationId;
  tokenType: "ui-session";
  userId: UserId;
  userRoles: NonEmptyArray<UserRole>;
}

export interface UISignupSessionAuthData {
  dateOfBirth: string;
  familyName: string;
  fiscalNumber: string | undefined;
  name: string;
  oneIdNonce: string;
  personIdentifier: string | undefined;
  spidCode: string | undefined;
  tokenType: "ui-signup-session";
  uniqueIdentifier: string;
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
        agreement: {
          id: c.agreement.id,
          knodeId: c.agreement.knode_id,
        },
        consumer: {
          id: c.consumer.id,
          knodeId: c.consumer.knode_id,
        },
        eservice: {
          id: c.eservice.id,
          knodeId: c.eservice.knode_id,
          version: c.eservice.version,
        },
        producer: {
          id: c.producer.id,
          knodeId: c.producer.knode_id,
        },
        scope: c.scope,
        tokenType: "external-ui-session",
      }),
    )
    .with(
      { type: "knode-api" },
      (c): KnodeApiAuthData => ({
        keychain: {
          id: c.keychain.id,
          knodeId: c.keychain.knode_id,
        },
        organization: {
          id: c.organization.id,
          knodeId: c.organization.knode_id,
        },
        tokenType: "knode-api",
      }),
    )
    .with(
      { type: "ui-signup-session" },
      (c): UISignupSessionAuthData => ({
        dateOfBirth: c.dateOfBirth,
        familyName: c.familyName,
        fiscalNumber: c.fiscalNumber,
        name: c.name,
        oneIdNonce: c.oneIdNonce,
        personIdentifier: c.personIdentifier,
        spidCode: c.spidCode,
        tokenType: "ui-signup-session",
        uniqueIdentifier: c.sub,
      }),
    )
    .exhaustive();
}

// Primary tenant id carried by the token: organization (UI session,
// knode-api), consumer (external UI session), or undefined for internal
// service-to-service tokens, which have no tenant.
export function tenantIdFromAuthData(authData: AuthData): string | undefined {
  return match(authData)
    .with({ tokenType: "ui-session" }, (a) => a.organizationId)
    .with({ tokenType: "external-ui-session" }, (a) => a.consumer.id)
    .with({ tokenType: "knode-api" }, (a) => a.organization.id)
    .with({ tokenType: "internal" }, () => undefined)
    .exhaustive();
}
