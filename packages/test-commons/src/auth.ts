import type {
  InternalTokenClaims,
  KnodiaTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";
import type { OrganizationId, UserId } from "@knodia/common-models/ids";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { UnsecuredJWT } from "jose";
import { match } from "ts-pattern";

const TEST_USER_ID = unsafeBrandId<UserId>(
  "10000000-1000-1000-8000-000000000001",
);
const TEST_ORGANIZATION_ID = unsafeBrandId<OrganizationId>(
  "20000000-2000-1000-8000-000000000002",
);

/**
 * Creates an unsecured JWT (`alg: "none"`) from test claims.
 * The auth mock decodes it with `decodeJwt` (no signature verification).
 *
 * Call with no args to get a token with the default test claims.
 */
export function createTestTokenPayload(
  type: KnodiaTokenClaims["type"],
): string {
  const claims = match(type)
    .with("ui-session", () => getTestUISessionTokenClaims())
    .with("internal", getTestInternalTokenClaims)
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
  props: Partial<Pick<UISessionTokenClaims, "roles">> = {},
): UISessionTokenClaims {
  return {
    aud: "test-audience",
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    organizationId: TEST_ORGANIZATION_ID,
    roles: props.roles ?? ["administrative"],
    sub: TEST_USER_ID,
    type: "ui-session",
  };
}
