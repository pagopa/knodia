import {
  ExternalUISessionMagicLinkTokenClaims,
  UISessionRefreshTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import {
  type AgreementId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";
import { NonEmptyArray } from "@knodia/common-models/types";
import { verifyAgainstJwksSets } from "@knodia/fastify-zod-api-commons/auth";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import { type TokenGenerator } from "@knodia/token-generator";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import z from "zod";

import type { BffProcessConfig } from "../config/config.ts";

import { type JtiReplayStore } from "./jtiReplayStore.ts";

const CognitoPayload = z.object({
  "cognito:groups": NonEmptyArray(z.string()),
  sub: z.string(),
  username: z.string(),
});

const ClaimsFromCognito = z.object({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  sub: UserId,
  username: z.string(),
});

type ClaimsFromCognito = z.infer<typeof ClaimsFromCognito>;

export function authServiceBuilder(
  config: BffProcessConfig,
  tokenGenerator: TokenGenerator,
  refreshTokenStore: JtiReplayStore,
  magicLinkTokenStore: JtiReplayStore,
) {
  const cognitoJwks = createRemoteJWKSet(new URL(config.cognitoJwksUrl));
  const bffJwksSets = config.wellKnownUrls.map((url) =>
    createRemoteJWKSet(new URL(url)),
  );

  const tokenParams = {
    audience: config.uiSessionJwt.audience,
    issuer: config.uiSessionJwt.issuer,
    kid: config.uiSessionJwt.kid,
  };

  async function generateTokenPairFromClaims(
    claims: ClaimsFromCognito,
  ): Promise<{ refreshToken: string; uiSessionToken: string }> {
    const [uiSession, refresh] = await Promise.all([
      tokenGenerator.generateUISessionToken({
        ...tokenParams,
        organizationId: claims.organizationId,
        roles: claims.roles,
        secondsDuration: config.uiSessionJwt.secondsDuration,
        subject: claims.sub,
        username: claims.username,
      }),
      tokenGenerator.generateUIRefreshToken({
        ...tokenParams,
        organizationId: claims.organizationId,
        roles: claims.roles,
        secondsDuration: config.refreshJwt.secondsDuration,
        subject: claims.sub,
        username: claims.username,
      }),
    ]);
    return {
      refreshToken: refresh.serialized,
      uiSessionToken: uiSession.serialized,
    };
  }

  async function verifyRefreshToken(token: string): Promise<ClaimsFromCognito> {
    const rawPayload = await verifyAgainstJwksSets({
      algorithms: ["RS256"],
      audience: config.acceptedAudiences,
      errorMessage: "Refresh token verification failed",
      issuer: config.uiSessionJwt.issuer,
      jwksSets: bffJwksSets,
      token,
    });

    const parsed = UISessionRefreshTokenClaims.safeParse(rawPayload);
    if (!parsed.success) {
      throw unauthorizedError("Invalid refresh token claims");
    }

    const firstUse = await refreshTokenStore.consume(
      parsed.data.jti,
      parsed.data.exp,
    );
    if (!firstUse) {
      throw unauthorizedError("Refresh token already used");
    }

    return ClaimsFromCognito.parse({
      organizationId: parsed.data.organizationId,
      roles: parsed.data.roles,
      sub: parsed.data.sub,
      username: parsed.data.username,
    });
  }

  async function verifyMagicLinkToken(
    token: string,
  ): Promise<ExternalUISessionMagicLinkTokenClaims> {
    const rawPayload = await verifyAgainstJwksSets({
      algorithms: ["RS256"],
      audience: config.externalUiSessionMagicLinkAccepted.audience,
      errorMessage: "Magic-link token verification failed",
      issuer: config.externalUiSessionMagicLinkAccepted.issuer,
      jwksSets: bffJwksSets,
      token,
    });

    const parsed = ExternalUISessionMagicLinkTokenClaims.safeParse(rawPayload);
    if (!parsed.success) {
      throw unauthorizedError("Invalid magic-link token claims");
    }
    // No explicit scope check: ExternalUISessionScope is a single-value Zod
    // enum today, so safeParse above already rejects any other scope with 401.
    // WARNING: this is load-bearing — the moment ExternalUISessionScope gains
    // a second value, exchangeMagicLinkToken below will forward whatever
    // scope the magic-link carried (`scope: claims.scope`) to
    // generateExternalUISessionToken without narrowing. Re-add an explicit
    // scope check here (or an allow-list parameter) at that point.

    const firstUse = await magicLinkTokenStore.consume(
      parsed.data.jti,
      parsed.data.exp,
    );
    if (!firstUse) {
      throw unauthorizedError("Magic-link token already used");
    }

    return parsed.data;
  }

  return {
    async exchangeMagicLinkToken(magicLinkToken: string): Promise<{
      agreementId: AgreementId;
      externalUiSessionToken: string;
    }> {
      const claims = await verifyMagicLinkToken(magicLinkToken);
      const { serialized } =
        await tokenGenerator.generateExternalUISessionToken({
          agreementId: claims.agreementId,
          audience: config.externalUiSessionJwt.audience,
          consumerId: claims.consumerId,
          consumerKnodeId: claims.consumerKnodeId,
          eserviceId: claims.eserviceId,
          eserviceVersionId: claims.eserviceVersionId,
          issuer: config.externalUiSessionJwt.issuer,
          kid: config.externalUiSessionJwt.kid,
          producerId: claims.producerId,
          scope: claims.scope,
          secondsDuration: config.externalUiSessionJwt.secondsDuration,
          subject: claims.agreementId,
        });
      return {
        agreementId: claims.agreementId,
        externalUiSessionToken: serialized,
      };
    },

    async generateUISessionTokenPair(cognitoToken: string): Promise<{
      refreshToken: string;
      uiSessionToken: string;
    }> {
      const claims = await validateCognitoToken(
        cognitoToken,
        cognitoJwks,
        config.cognitoIssuer,
      );
      return generateTokenPairFromClaims(claims);
    },

    async refreshUISessionTokenPair(refreshToken: string): Promise<{
      refreshToken: string;
      uiSessionToken: string;
    }> {
      const claims = await verifyRefreshToken(refreshToken);
      return generateTokenPairFromClaims(claims);
    },

    async revokeRefreshToken(refreshToken: string): Promise<void> {
      try {
        const payload = decodeJwt(refreshToken);
        const parsed = UISessionRefreshTokenClaims.safeParse(payload);
        if (parsed.success) {
          await refreshTokenStore.revoke(parsed.data.jti, parsed.data.exp);
        }
      } catch {
        // Best-effort: if the token is malformed, there is nothing to revoke
      }
    },
  };
}

async function validateCognitoToken(
  token: string,
  cognitoJwks: ReturnType<typeof createRemoteJWKSet>,
  cognitoIssuer: string,
): Promise<ClaimsFromCognito> {
  const rawPayload = await verifyCognitoJwt(token, cognitoJwks, cognitoIssuer);

  const payloadParsed = CognitoPayload.safeParse(rawPayload);
  if (!payloadParsed.success) {
    throw unauthorizedError("Invalid Cognito token payload");
  }

  const cognitoPayload = payloadParsed.data;
  const groups = cognitoPayload["cognito:groups"];

  const roles = groups
    .filter((g) => g.startsWith("role:"))
    .flatMap((g) => {
      const parsed = UserRole.safeParse(g.slice("role:".length));
      return parsed.success ? [parsed.data] : [];
    });
  const orgGroup = groups.find((g) => g.startsWith("org:"));

  if (!orgGroup) {
    throw unauthorizedError("Missing organization claim in cognito token");
  }

  if (roles.length === 0) {
    throw unauthorizedError("Missing role claims in cognito token");
  }

  const claimsParsed = ClaimsFromCognito.safeParse({
    organizationId: orgGroup.slice("org:".length),
    roles,
    sub: cognitoPayload.sub,
    username: cognitoPayload.username,
  });

  if (!claimsParsed.success) {
    throw unauthorizedError("Invalid claims in cognito token");
  }

  return claimsParsed.data;
}

async function verifyCognitoJwt(
  token: string,
  cognitoJwks: ReturnType<typeof createRemoteJWKSet>,
  cognitoIssuer: string,
): Promise<unknown> {
  try {
    const { payload } = await jwtVerify(token, cognitoJwks, {
      algorithms: ["RS256"],
      issuer: cognitoIssuer,
    });
    return payload;
  } catch {
    throw unauthorizedError("Cognito token verification failed");
  }
}
