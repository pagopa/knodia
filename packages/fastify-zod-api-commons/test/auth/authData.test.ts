import type {
  InternalTokenClaims,
  UISessionTokenClaims,
} from "@knodia/common-models/auth";

import { generateId, OrganizationId, UserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  extractAuthDataFromToken,
  type InternalAuthData,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";

const userId = generateId<UserId>();
const organizationId = generateId<OrganizationId>();

const uiSessionClaims: UISessionTokenClaims = {
  aud: "test-audience",
  exp: 9999999999,
  iat: 0,
  iss: "test-issuer",
  jti: "test-jti",
  organizationId: organizationId,
  roles: ["administrative", "technical"],
  sub: userId,
  type: "ui-session" as const,
};

const internalClaims: InternalTokenClaims = {
  aud: "test-audience",
  exp: 9999999999,
  iat: 0,
  iss: "test-issuer",
  jti: "test-jti",
  sub: "test-internal-service",
  type: "internal" as const,
};

describe("extractAuthDataFromToken", () => {
  it("maps UI session claims to UISessionAuthData", () => {
    const result = extractAuthDataFromToken(uiSessionClaims);

    expect(result).toEqual({
      organizationId,
      tokenType: "ui-session",
      userId,
      userRoles: ["administrative", "technical"],
    } satisfies UISessionAuthData);
  });

  it("maps internal claims to InternalAuthData", () => {
    const result = extractAuthDataFromToken(internalClaims);

    expect(result).toEqual({
      tokenType: "internal",
    } satisfies InternalAuthData);
  });
});
