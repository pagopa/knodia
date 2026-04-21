import type {
  ExternalUISessionScope,
  ExternalUISessionTokenClaims,
  InternalTokenClaims,
  UISessionTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { NonEmptyArray } from "@knodia/common-models/types";

import {
  type ExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import {
  type AgreementId,
  type EserviceId,
  type EserviceVersionId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import { UnsecuredJWT } from "jose";
import { match } from "ts-pattern";

export const TEST_USER_ID = unsafeBrandUserId(
  "10000000-1000-1000-8000-000000000001",
);
export const TEST_ORGANIZATION_ID = unsafeBrandId<OrganizationId>(
  "20000000-2000-1000-8000-000000000002",
);
const TEST_AGREEMENT_ID = unsafeBrandId<AgreementId>(
  "30000000-3000-1000-8000-000000000003",
);
const TEST_CONSUMER_ID = unsafeBrandExternalId<OrganizationId>(
  "40000000-4000-1000-8000-000000000004",
);
const TEST_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "50000000-5000-1000-8000-000000000005",
);
const TEST_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "60000000-6000-1000-8000-000000000006",
);
const TEST_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "70000000-7000-1000-8000-000000000007",
);

export type TestToken =
  | {
      agreementId?: AgreementId;
      consumerId?: ExternalId<OrganizationId>;
      consumerKnodeId?: KnodeId;
      eserviceId?: EserviceId;
      eserviceVersionId?: EserviceVersionId;
      producerId?: OrganizationId;
      scope?: ExternalUISessionScope;
      type: "external-ui-session";
    }
  | {
      organizationId?: OrganizationId;
      roles?: NonEmptyArray<UserRole>;
      type: "ui-session";
      userId?: UserId;
      username?: string;
    }
  | { type: "internal" };

/**
 * Creates an unsecured JWT (`alg: "none"`) from test claims.
 * The auth mock decodes it with `decodeJwt` (no signature verification).
 */
export function createTestTokenPayload(spec: TestToken): string {
  const claims = match(spec)
    .with(
      { type: "ui-session" },
      ({ organizationId, roles, userId, username }) =>
        getTestUISessionTokenClaims({
          organizationId,
          roles,
          userId,
          username,
        }),
    )
    .with({ type: "internal" }, getTestInternalTokenClaims)
    .with({ type: "external-ui-session" }, (props) =>
      getTestExternalUISessionTokenClaims(props),
    )
    .exhaustive();
  return new UnsecuredJWT(claims).encode();
}

export function getTestExternalUISessionTokenClaims(
  props: {
    agreementId?: AgreementId;
    consumerId?: ExternalId<OrganizationId>;
    consumerKnodeId?: KnodeId;
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
    producerId?: OrganizationId;
    scope?: ExternalUISessionScope;
  } = {},
): ExternalUISessionTokenClaims {
  return {
    agreementId: props.agreementId ?? TEST_AGREEMENT_ID,
    aud: "test-audience",
    consumerId: props.consumerId ?? TEST_CONSUMER_ID,
    consumerKnodeId: props.consumerKnodeId ?? KnodeId.enum.Orion,
    eserviceId: props.eserviceId ?? TEST_ESERVICE_ID,
    eserviceVersionId: props.eserviceVersionId ?? TEST_ESERVICE_VERSION_ID,
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    producerId: props.producerId ?? TEST_PRODUCER_ID,
    scope: props.scope ?? "agreement-activation",
    sub: "test-external-user",
    type: "external-ui-session",
  };
}

export function getTestInternalTokenClaims(): InternalTokenClaims {
  return {
    aud: "test-audience",
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    sub: "test-internal-service",
    type: "internal",
  };
}

export function getTestUISessionTokenClaims(
  props: {
    organizationId?: OrganizationId;
    roles?: NonEmptyArray<UserRole>;
    userId?: UserId;
    username?: string;
  } = {},
): UISessionTokenClaims {
  return {
    aud: "test-audience",
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    organizationId: props.organizationId ?? TEST_ORGANIZATION_ID,
    roles: props.roles ?? ["administrative"],
    sub: props.userId ?? TEST_USER_ID,
    type: "ui-session",
    username: props.username ?? "test-user",
  };
}
