import type { TokenGenerator } from "@knodia/token-generator";

import { genericInternalError } from "@knodia/common-models/errors";
import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { OneIdentityClient } from "../clients/oneIdentityClient.ts";
import type { OneIdentityConfig } from "../config/config.ts";

export type AuthService = ReturnType<typeof authServiceBuilder>;

export function authServiceBuilder(
  config: OneIdentityConfig,
  oneIdentityClient: OneIdentityClient,
  tokenGenerator: TokenGenerator,
) {
  return {
    async exchangeOIDCCode({
      code,
      oidcSession,
      state,
    }: {
      code: string;
      oidcSession: null | { nonce: string; state: string };
      state: string;
    }) {
      if (!oidcSession || oidcSession.state !== state) {
        throw forbiddenError("Invalid OIDC session state");
      }

      const tokenResponse =
        await oneIdentityClient.exchangeAuthorizationCode(code);

      const { claims } = await oneIdentityClient.validateIdToken(
        tokenResponse.id_token,
        oidcSession.nonce,
      );

      if (
        claims.spidCode === undefined &&
        claims.fiscalNumber === undefined &&
        claims.PersonIdentifier === undefined
      ) {
        throw genericInternalError(
          "Missing required claim in ID token (spidCode, fiscalNumber or PersonIdentifier)",
        );
      }

      // The single-identifier selection (SPID/CIE/eIDAS precedence) lives in
      // generateUISignupSessionToken: it keeps exactly one and sets the sub.
      const sessionToken = await tokenGenerator.generateUISignupSessionToken({
        audience: config.uiSignupSessionJwt.audience,
        dateOfBirth: claims.dateOfBirth,
        familyName: claims.familyName,
        fiscalNumber: claims.fiscalNumber,
        issuer: config.uiSignupSessionJwt.issuer,
        kid: config.uiSignupSessionJwt.kid,
        name: claims.name,
        oneIdNonce: claims.nonce,
        PersonIdentifier: claims.PersonIdentifier,
        secondsDuration: config.uiSignupSessionJwt.secondsDuration,
        spidCode: claims.spidCode,
      });

      return { uiSignupSessionToken: sessionToken.serialized };
    },

    startOIDCSession({ nonce, state }: { nonce: string; state: string }) {
      return {
        loginUrl: oneIdentityClient.buildOneIdentityLoginUrl({
          nonce,
          state,
        }),
      };
    },
  };
}
