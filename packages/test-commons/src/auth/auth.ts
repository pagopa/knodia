import type {
  InternalTokenClaims,
  UISessionTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import type { NonEmptyArray } from "@knodia/common-models/types";

import {
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

export type TestToken =
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
    .exhaustive();
  return new UnsecuredJWT(claims).encode();
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
