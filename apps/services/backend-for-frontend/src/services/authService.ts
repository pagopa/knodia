import {
  UISessionRefreshTokenClaims,
  UserRole,
} from "@knodia/common-models/auth";
import { OrganizationId, UserId } from "@knodia/common-models/ids";
import { NonEmptyArray } from "@knodia/common-models/types";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import { type TokenGenerator } from "@knodia/token-generator";
import { createRemoteJWKSet, jwtVerify } from "jose";
import z from "zod";

import { config } from "../config/config.ts";

// In-memory store of consumed refresh token JTIs to prevent reuse.
// Entries are auto-purged once the token's exp has passed.
const usedRefreshJtis = new Map<string, number>();

const cleanupTimer = setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, exp] of usedRefreshJtis) {
    if (exp <= now) usedRefreshJtis.delete(jti);
  }
}, 600_000);
cleanupTimer.unref();

const CognitoPayload = z.object({
  "cognito:groups": NonEmptyArray(z.string()),
  sub: z.string(),
});

const ClaimsFromCognito = z.object({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  sub: UserId,
});
type ClaimsFromCognito = z.infer<typeof ClaimsFromCognito>;

export function authServiceBuilder(tokenGenerator: TokenGenerator) {
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
      }),
      tokenGenerator.generateUIRefreshToken({
        ...tokenParams,
        organizationId: claims.organizationId,
        roles: claims.roles,
        secondsDuration: config.refreshJwt.secondsDuration,
        subject: claims.sub,
      }),
    ]);
    return {
      refreshToken: refresh.serialized,
      uiSessionToken: uiSession.serialized,
    };
  }

  async function validateCognitoToken(
    token: string,
  ): Promise<ClaimsFromCognito> {
    const rawPayload = await verifyCognitoJwt(token);

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
    });

    if (!claimsParsed.success) {
      throw unauthorizedError("Invalid claims in cognito token");
    }

    return claimsParsed.data;
  }

  async function verifyCognitoJwt(token: string): Promise<unknown> {
    try {
      const { payload } = await jwtVerify(token, cognitoJwks, {
        algorithms: ["RS256"],
        issuer: config.cognitoIssuer,
      });
      return payload;
    } catch {
      throw unauthorizedError("Cognito token verification failed");
    }
  }

  async function verifyRefreshToken(token: string): Promise<ClaimsFromCognito> {
    const rawPayload = await Promise.any(
      bffJwksSets.map(async (jwks) => {
        const { payload } = await jwtVerify(token, jwks, {
          algorithms: ["RS256"],
          audience: config.acceptedAudiences,
          issuer: config.uiSessionJwt.issuer,
        });
        return payload;
      }),
    ).catch(() => {
      throw unauthorizedError("Refresh token verification failed");
    });

    const parsed = UISessionRefreshTokenClaims.safeParse(rawPayload);
    if (!parsed.success) {
      throw unauthorizedError("Invalid refresh token claims");
    }

    if (usedRefreshJtis.has(parsed.data.jti)) {
      throw unauthorizedError("Refresh token already used");
    }
    usedRefreshJtis.set(parsed.data.jti, parsed.data.exp);

    return ClaimsFromCognito.parse({
      organizationId: parsed.data.organizationId,
      roles: parsed.data.roles,
      sub: parsed.data.sub,
    });
  }

  return {
    async generateUISessionTokenPair(cognitoToken: string): Promise<{
      refreshToken: string;
      uiSessionToken: string;
    }> {
      const claims = await validateCognitoToken(cognitoToken);
      return generateTokenPairFromClaims(claims);
    },

    async refreshUISessionTokenPair(refreshTokenJwt: string): Promise<{
      refreshToken: string;
      uiSessionToken: string;
    }> {
      const claims = await verifyRefreshToken(refreshTokenJwt);
      return generateTokenPairFromClaims(claims);
    },
  };
}
