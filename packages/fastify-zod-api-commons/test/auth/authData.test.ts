import {
  getTestExternalUISessionTokenClaims,
  getTestInternalTokenClaims,
  getTestKnodeApiTokenClaims,
  getTestUISessionTokenClaims,
} from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  type ExternalUISessionAuthData,
  extractAuthDataFromToken,
  type InternalAuthData,
  type KnodeApiAuthData,
  type UISessionAuthData,
} from "../../src/auth/authData.ts";

const uiSessionClaims = getTestUISessionTokenClaims();
const internalClaims = getTestInternalTokenClaims();
const externalUISessionClaims = getTestExternalUISessionTokenClaims();
const knodeApiClaims = getTestKnodeApiTokenClaims();

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

  it("maps knode-api claims to KnodeApiAuthData", () => {
    const result = extractAuthDataFromToken(knodeApiClaims);

    expect(result).toEqual({
      keychain: {
        id: knodeApiClaims.keychain.id,
        knodeId: knodeApiClaims.keychain.knode_id,
      },
      organization: {
        id: knodeApiClaims.organization.id,
        knodeId: knodeApiClaims.organization.knode_id,
      },
      tokenType: knodeApiClaims.type,
    } satisfies KnodeApiAuthData);
  });

  it("maps external-ui-session claims to ExternalUISessionAuthData", () => {
    const result = extractAuthDataFromToken(externalUISessionClaims);

    expect(result).toEqual({
      agreement: {
        id: externalUISessionClaims.agreement.id,
        knodeId: externalUISessionClaims.agreement.knode_id,
      },
      consumer: {
        id: externalUISessionClaims.consumer.id,
        knodeId: externalUISessionClaims.consumer.knode_id,
      },
      eservice: {
        id: externalUISessionClaims.eservice.id,
        knodeId: externalUISessionClaims.eservice.knode_id,
        version: externalUISessionClaims.eservice.version,
      },
      producer: {
        id: externalUISessionClaims.producer.id,
        knodeId: externalUISessionClaims.producer.knode_id,
      },
      scope: externalUISessionClaims.scope,
      tokenType: externalUISessionClaims.type,
    } satisfies ExternalUISessionAuthData);
  });
});
