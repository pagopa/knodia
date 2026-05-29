import type { SignupDbService } from "@knodia/db-signup/services";
import type { UISignupSessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { SignupUser } from "@knodia/signup-models";
import type { TokenGenerator } from "@knodia/token-generator";

import { genericInternalError } from "@knodia/common-models/errors";
import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { OneIdentityClient } from "../clients/oneIdentityClient.ts";
import type { SignupManagerConfig } from "../config/config.ts";
import type { API_ConfirmOnboardingRequestBody } from "../models/api.ts";

import {
  assertSignupUserEmailDoesNotExist,
  assertSignupUserIdentifiersDoNotExist,
} from "../utils/validators.ts";

export type SignupService = ReturnType<typeof signupServiceBuilder>;

export function signupServiceBuilder(
  config: SignupManagerConfig,
  oneIdentityClient: OneIdentityClient,
  tokenGenerator: TokenGenerator,
  signupDbService: SignupDbService,
) {
  return {
    async confirmOnboarding(
      { email }: API_ConfirmOnboardingRequestBody,
      { authData }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      const now = new Date();
      const signupUserId = generateId<SignupUserId>();

      await assertSignupUserIdentifiersDoNotExist(authData, signupDbService);
      await assertSignupUserEmailDoesNotExist(email, signupDbService);

      // TODO: Produce names
      const lynxOrganizationName = `TODO`;
      const lynxUserName = `TODO`;
      const orionOrganizationName = `TODO`;
      const orionUserName = `TODO`;

      const newSignupUser: SignupUser = {
        createdAt: now,
        dateOfBirth: authData.dateOfBirth,
        email,
        familyName: authData.familyName,
        fiscalNumber: authData.fiscalNumber,
        generatedEntities: {
          Lynx: {
            organizationName: lynxOrganizationName,
            userName: lynxUserName,
          },
          Orion: {
            organizationName: orionOrganizationName,
            userName: orionUserName,
          },
        },
        name: authData.name,
        personIdentifier: authData.personalIdentifier,
        signupUserId,
        spidCode: authData.spidCode,
        status: "ACTIVE",
        updatedAt: now,
      };

      await signupDbService.insertSignupUser(newSignupUser);
      // TODO Produce Event
    },

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
       * - SPID can return `spidCode` and `fiscalNumber`;
       * - CIE returns `fiscalNumber`;
       * - eIDAS returns `PersonIdentifier`.
       */
      const subject =
        claims.PersonIdentifier ?? claims.spidCode ?? claims.fiscalNumber;
      if (!subject) {
        throw genericInternalError(
          "Missing required claim in ID token (spidCode, fiscalNumber or PersonIdentifier)",
        );
      }

      const sessionToken = await tokenGenerator.generateUISignupSessionToken({
        audience: config.uiSignupSessionJwt.audience,
        dateOfBirth: claims.dateOfBirth,
        familyName: claims.familyName,
        fiscalNumber: claims.fiscalNumber,
        issuer: config.uiSignupSessionJwt.issuer,
        kid: config.uiSignupSessionJwt.kid,
        name: claims.name,
        PersonIdentifier: claims.PersonIdentifier,
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
