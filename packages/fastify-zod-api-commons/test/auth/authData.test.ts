import {
  getTestExternalUISessionTokenClaims,
  getTestInternalTokenClaims,
  getTestUISessionTokenClaims,
} from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  type ExternalUISessionAuthData,
  extractAuthDataFromToken,
  type InternalAuthData,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";

const uiSessionClaims = getTestUISessionTokenClaims();
const internalClaims = getTestInternalTokenClaims();
const externalUISessionClaims = getTestExternalUISessionTokenClaims();

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

  it("maps external-ui-session claims to ExternalUISessionAuthData", () => {
    const result = extractAuthDataFromToken(externalUISessionClaims);

    expect(result).toEqual({
      agreementId: externalUISessionClaims.agreementId,
      consumerId: externalUISessionClaims.consumerId,
      consumerKnodeId: externalUISessionClaims.consumerKnodeId,
      eserviceId: externalUISessionClaims.eserviceId,
      eserviceVersionId: externalUISessionClaims.eserviceVersionId,
      producerId: externalUISessionClaims.producerId,
      scope: externalUISessionClaims.scope,
      tokenType: externalUISessionClaims.type,
    } satisfies ExternalUISessionAuthData);
  });
});
