import type { TokenGenerator } from "@knodia/token-generator";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { OneIdentityClient } from "../clients/oneIdentityClient.ts";
import type { SignupManagerConfig } from "../config/config.ts";

export type SignupService = ReturnType<typeof signupServiceBuilder>;

export function signupServiceBuilder(
  config: SignupManagerConfig,
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

      /**
       * In One Identity, there is no handy way to distinguish between SPID and CIE users,
       * so to identify the user we rely on the presence of the spidCode claim, which is only
       * present for SPID users and fallback to the fiscalNumber claim for CIE users.
       */
      const subject = claims.spidCode ?? claims.fiscalNumber;

      const sessionToken = await tokenGenerator.generateUISignupSessionToken({
        audience: config.uiSignupSessionJwt.audience,
        dateOfBirth: claims.dateOfBirth,
        familyName: claims.familyName,
        fiscalNumber: claims.fiscalNumber,
        issuer: config.uiSignupSessionJwt.issuer,
        kid: config.uiSignupSessionJwt.kid,
        name: claims.name,
        secondsDuration: config.uiSignupSessionJwt.secondsDuration,
        spidCode: claims.spidCode,
        subject,
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
