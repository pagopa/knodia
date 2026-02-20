import type { UISessionTokenClaims } from "@knodia/common-models/auth";

import { generateId, OrganizationId, UserId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  extractAuthDataFromToken,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";

const userId = generateId<UserId>();
const organizationId = generateId<OrganizationId>();

const baseUISessionClaims: UISessionTokenClaims = {
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

describe("extractAuthDataFromToken", () => {
  it("maps UI session claims to UISessionAuthData", () => {
    const result = extractAuthDataFromToken(baseUISessionClaims);

    expect(result).toEqual({
      organizationId,
      tokenType: "ui-session",
      userId,
      userRoles: ["administrative", "technical"],
    } satisfies UISessionAuthData);
  });
});
