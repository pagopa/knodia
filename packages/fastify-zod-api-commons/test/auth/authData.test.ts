import {
  getTestInternalTokenClaims,
  getTestUISessionTokenClaims,
} from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  extractAuthDataFromToken,
  type InternalAuthData,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";

const uiSessionClaims = getTestUISessionTokenClaims();
const internalClaims = getTestInternalTokenClaims();

describe("extractAuthDataFromToken", () => {
  it("maps UI session claims to UISessionAuthData", () => {
    const result = extractAuthDataFromToken(uiSessionClaims);

    expect(result).toEqual({
      organizationId: uiSessionClaims.organizationId,
      tokenType: uiSessionClaims.type,
      userId: uiSessionClaims.sub,
      userRoles: uiSessionClaims.roles,
    } satisfies UISessionAuthData);
  });

  it("maps internal claims to InternalAuthData", () => {
    const result = extractAuthDataFromToken(internalClaims);

    expect(result).toEqual({
      tokenType: internalClaims.type,
    } satisfies InternalAuthData);
  });
});
