import type { RequestContextData } from "@fastify/request-context";
import type { TokenGenerator } from "@knodia/token-generator";

import { selectSignupIdentifier } from "@knodia/common-models/auth";
import { genericInternalError } from "@knodia/common-models/errors";
import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";
import {
  enforceRateLimit,
  hashRateLimitKey,
  type RateLimiter,
} from "@knodia/fastify-zod-api-commons/rate-limit";

import type { OneIdentityClient } from "../clients/oneIdentityClient.ts";
import type { OneIdentityConfig } from "../config/config.ts";

export type AuthService = ReturnType<typeof authServiceBuilder>;

export function authServiceBuilder(
  config: OneIdentityConfig,
  oneIdentityClient: OneIdentityClient,
  tokenGenerator: TokenGenerator,
  rateLimiter: RateLimiter,
) {
  return {
    async exchangeOIDCCode(
      {
        code,
        oidcSession,
        state,
      }: {
        code: string;
        oidcSession: null | { nonce: string; state: string };
        state: string;
      },
      { logger }: RequestContextData,
    ) {
      logger.info("Exchanging OIDC code for UI signup session token");

      if (!oidcSession || oidcSession.state !== state) {
        throw forbiddenError("Invalid OIDC session state");
      }

      const tokenResponse = await oneIdentityClient.exchangeAuthorizationCode(
        code,
        logger,
      );

      const { claims } = await oneIdentityClient.validateIdToken(
        tokenResponse.id_token,
        oidcSession.nonce,
      );

      // SPID returns both spidCode and fiscalNumber; persisting both would let a
      // later CIE login (fiscalNumber only) collide with the same person's SPID
      // user. Keep exactly one, by precedence.
      const identifier = selectSignupIdentifier({
        fiscalNumber: claims.fiscalNumber,
        personIdentifier: claims.PersonIdentifier,
        spidCode: claims.spidCode,
      });
      if (identifier === undefined) {
        throw genericInternalError(
          "Missing required claim in ID token (spidCode, fiscalNumber or PersonIdentifier)",
        );
      }

      // Rate-limit on the resolved identifier, after the IdP exchange so we never
      // mint a token over the limit. Hash it like the protected routes do (it's
      // PII and must not land in Redis keys or logs as plaintext).
      await enforceRateLimit(
        rateLimiter,
        hashRateLimitKey(identifier.value),
        logger,
      );

      const sessionToken = await tokenGenerator.generateUISignupSessionToken({
        audience: config.uiSignupSessionJwt.audience,
        dateOfBirth: claims.dateOfBirth,
        familyName: claims.familyName,
        identifier,
        issuer: config.uiSignupSessionJwt.issuer,
        kid: config.uiSignupSessionJwt.kid,
        name: claims.name,
        oneIdNonce: claims.nonce,
        secondsDuration: config.uiSignupSessionJwt.secondsDuration,
      });

      return { uiSignupSessionToken: sessionToken.serialized };
    },

    startOIDCSession(
      { nonce, state }: { nonce: string; state: string },
      { logger }: RequestContextData,
    ) {
      logger.info("Starting OIDC session");

      return {
        loginUrl: oneIdentityClient.buildOneIdentityLoginUrl({
          nonce,
          state,
        }),
      };
    },
  };
}
