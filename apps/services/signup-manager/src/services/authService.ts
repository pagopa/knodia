import type { TokenGenerator } from "@knodia/token-generator";

import { selectSignupIdentifier } from "@knodia/common-models/auth";
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

      // SPID returns both spidCode and fiscalNumber; CIE returns fiscalNumber;
      // eIDAS returns PersonIdentifier. We persist exactly one, picked by
      // precedence, so a SPID login never stores its fiscalNumber and collides
      // with a later CIE login of the same person.
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
