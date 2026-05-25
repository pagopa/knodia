/* eslint-disable max-lines-per-function */
import type { JtiReplayStore } from "@knodia/db-jti-replay-store";

import { requestContext } from "@fastify/request-context";
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
import { CommaSeparatedList, NonEmptyArray } from "@knodia/common-models/types";
import { verifyAgainstJwksSets } from "@knodia/fastify-zod-api-commons/auth";
import { getContextValues } from "@knodia/fastify-zod-api-commons/context";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import {
  enforceRateLimit,
  type RateLimiter,
} from "@knodia/fastify-zod-api-commons/rate-limit";
import { type TokenGenerator } from "@knodia/token-generator";
import { createRemoteJWKSet, jwtVerify } from "jose";
import z from "zod";

import type { BffProcessConfig } from "../config/config.ts";

const CognitoPayload = z.object({
  "cognito:groups": NonEmptyArray(z.string()),
  "cognito:username": z.string(),
  "custom:roles": CommaSeparatedList(UserRole),
  sub: z.string(),
  // We expect the OIDC token to be an ID token, which contains the role custom attributes.
  token_use: z.literal("id"),
});

const ClaimsFromCognito = z.object({
  organizationId: OrganizationId,
  roles: NonEmptyArray(UserRole),
  sub: UserId,
  username: z.string(),
});

interface AuthServiceBuilderOptions {
  config: BffProcessConfig;
  magicLinkTokenStore: JtiReplayStore;
  rateLimiter: RateLimiter;
  refreshTokenStore: JtiReplayStore;
  tokenGenerator: TokenGenerator;
}

type ClaimsFromCognito = z.infer<typeof ClaimsFromCognito>;

export function authServiceBuilder({
  config,
  magicLinkTokenStore,
  rateLimiter,
  refreshTokenStore,
  tokenGenerator,
}: AuthServiceBuilderOptions) {
  // Always invoked after credential verification — buckets key on the
  // resolved tenant, not on IP / a shared fallback.
  function rateLimit(rateLimitKey: string): Promise<void> {
    const { logger } = getContextValues(requestContext);
    return enforceRateLimit(rateLimiter, rateLimitKey, logger);
  }

  async function consumeSingleUseJti(
    store: JtiReplayStore,
    jti: string,
    exp: number,
    label: string,
  ): Promise<void> {
    const firstUse = await store.consume(jti, exp);
    if (!firstUse) {
      throw unauthorizedError(`${label} already used`);
    }
  }

  const cognitoJwks = createRemoteJWKSet(new URL(config.cognitoJwksUrl));
  const bffJwksSets = config.wellKnownUrls.map((url) =>
    createRemoteJWKSet(new URL(url)),
  );
  const magicLinkJwksSets =
    config.externalUiSessionMagicLinkAccepted.wellKnownUrls.map((url) =>
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

  async function validateCognitoToken(
    token: string,
  ): Promise<ClaimsFromCognito> {
    const rawPayload = await verifyCognitoJwt(token);

    const payloadParsed = CognitoPayload.safeParse(rawPayload);
    if (!payloadParsed.success) {
      throw unauthorizedError("Invalid Cognito token payload");
    }

    const cognitoPayload = payloadParsed.data;

    const roles = cognitoPayload["custom:roles"];

    const orgGroup = cognitoPayload["cognito:groups"].find((g) =>
      g.startsWith("org:"),
    );

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
      username: cognitoPayload["cognito:username"],
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

  async function verifyRefreshTokenClaims(
    token: string,
  ): Promise<{ claims: ClaimsFromCognito; exp: number; jti: string }> {
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

    return {
      claims: ClaimsFromCognito.parse({
        organizationId: parsed.data.organizationId,
        roles: parsed.data.roles,
        sub: parsed.data.sub,
        username: parsed.data.username,
      }),
      exp: parsed.data.exp,
      jti: parsed.data.jti,
    };
  }

  async function verifyMagicLinkTokenClaims(token: string): Promise<{
    claims: ExternalUISessionMagicLinkTokenClaims;
    exp: number;
    jti: string;
  }> {
    const rawPayload = await verifyAgainstJwksSets({
      algorithms: ["RS256"],
      audience: config.externalUiSessionMagicLinkAccepted.audience,
      errorMessage: "Magic-link token verification failed",
      issuer: config.externalUiSessionMagicLinkAccepted.issuer,
      jwksSets: magicLinkJwksSets,
      token,
    });

    const parsed = ExternalUISessionMagicLinkTokenClaims.safeParse(rawPayload);
    if (!parsed.success) {
      throw unauthorizedError("Invalid magic-link token claims");
    }

    return { claims: parsed.data, exp: parsed.data.exp, jti: parsed.data.jti };
  }

  return {
    async exchangeMagicLinkToken(magicLinkToken: string): Promise<{
      agreementId: AgreementId;
      externalUiSessionToken: string;
    }> {
      const { claims, exp, jti } =
        await verifyMagicLinkTokenClaims(magicLinkToken);
      // Consume before rate-limit so replays 401 at the store without draining
      // the per-tenant bucket. See authService.unit.test.ts for the invariant.
      await consumeSingleUseJti(
        magicLinkTokenStore,
        jti,
        exp,
        "Magic-link token",
      );
      await rateLimit(claims.consumer.id);
      const { serialized } =
        await tokenGenerator.generateExternalUISessionToken({
          agreement: {
            id: claims.agreement.id,
            knodeId: claims.agreement.knode_id,
          },
          audience: config.externalUiSessionJwt.audience,
          consumer: {
            id: claims.consumer.id,
            knodeId: claims.consumer.knode_id,
          },
          eservice: {
            id: claims.eservice.id,
            knodeId: claims.eservice.knode_id,
            version: claims.eservice.version,
          },
          issuer: config.externalUiSessionJwt.issuer,
          kid: config.externalUiSessionJwt.kid,
          producer: {
            id: claims.producer.id,
            knodeId: claims.producer.knode_id,
          },
          scope: claims.scope,
          secondsDuration: config.externalUiSessionJwt.secondsDuration,
          subject: claims.agreement.id,
        });
      return {
        agreementId: claims.agreement.id,
        externalUiSessionToken: serialized,
      };
    },

    async generateUISessionTokenPair(cognitoToken: string): Promise<{
      refreshToken: string;
      uiSessionToken: string;
    }> {
      const claims = await validateCognitoToken(cognitoToken);
      await rateLimit(claims.organizationId);
      return generateTokenPairFromClaims(claims);
    },

    async refreshUISessionTokenPair(refreshToken: string): Promise<{
      refreshToken: string;
      uiSessionToken: string;
    }> {
      const { claims, exp, jti } = await verifyRefreshTokenClaims(refreshToken);
      // See exchangeMagicLinkToken for why the store runs before rate-limit.
      await consumeSingleUseJti(refreshTokenStore, jti, exp, "Refresh token");
      await rateLimit(claims.organizationId);
      return generateTokenPairFromClaims(claims);
    },

    async revokeRefreshToken(refreshToken: string): Promise<void> {
      // Signature is verified (not just decoded) so an allowed origin can't
      // spam DynamoDB writes with fabricated tokens. No rate-limit here:
      // a 429 would leave a valid JTI live for its full TTL (default 24h).
      try {
        const verified = await verifyRefreshTokenClaims(refreshToken);
        await refreshTokenStore.revoke(verified.jti, verified.exp);
      } catch (err) {
        // Best-effort: malformed / forged tokens are silent by design, but log
        // at warn so a JWKS-fetch / DynamoDB outage doesn't drop revocations
        // unobserved — verifyRefreshTokenClaims now hits the network.
        const { logger } = getContextValues(requestContext);
        logger.warn(
          `revokeRefreshToken skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  };
}
