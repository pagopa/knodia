import type { SignupDbService } from "@knodia/db-signup/services";
import type { UISignupSessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { TokenGenerator } from "@knodia/token-generator";

import { genericInternalError } from "@knodia/common-models/errors";
import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { PG_UNIQUE_VIOLATION } from "@knodia/common-models/pgErrorCodes";
import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";
import { type SignupUser, SignupUserStatus } from "@knodia/signup-models";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";

import type { OneIdentityClient } from "../clients/oneIdentityClient.ts";
import type { OneIdentityConfig } from "../config/config.ts";
import type { API_ConfirmOnboardingRequestBody } from "../models/api.ts";
import type { SignupEventProducer } from "./signupEventProducer.ts";

import { signupUserGeneratedEntitiesAlreadyTaken } from "../models/errors.ts";
import { generateRandomOrgName, toUserName } from "../utils/nameGenerator.ts";
import {
  assertSignupUserEmailDoesNotExist,
  assertSignupUserIdentifiersDoNotExist,
} from "../utils/validators.ts";

export type SignupService = ReturnType<typeof signupServiceBuilder>;

export function signupServiceBuilder(
  config: OneIdentityConfig,
  oneIdentityClient: OneIdentityClient,
  tokenGenerator: TokenGenerator,
  signupDbService: SignupDbService,
  signupEventProducer: SignupEventProducer,
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

      const { lynxOrganizationName, orionOrganizationName } =
        await generateUniqueOrganizationNames(signupDbService);

      const newSignupUser: SignupUser = {
        createdAt: now,
        dateOfBirth: authData.dateOfBirth,
        email,
        familyName: authData.familyName,
        fiscalNumber: authData.fiscalNumber,
        generatedEntities: {
          Lynx: {
            organizationName: lynxOrganizationName,
            userName: toUserName(lynxOrganizationName),
          },
          Orion: {
            organizationName: orionOrganizationName,
            userName: toUserName(orionOrganizationName),
          },
        },
        name: authData.name,
        personIdentifier: authData.personIdentifier,
        signupUserId,
        spidCode: authData.spidCode,
        status: SignupUserStatus.enum.Active,
        updatedAt: now,
      };

      try {
        await signupDbService.insertSignupUser(newSignupUser);
      } catch (error) {
        /**
         * The uniqueness checks in the asserts above are performed before the insert and are not
         * done in the same transaction. If a concurrent onboarding inserts the same email or one of
         * the same identifiers in the meantime, the database will reject this insert with a unique
         * constraint violation.
         *
         * In that case, we map the database error to a 409 Conflict so the client gets a meaningful
         * response instead of a generic internal error.
         */

        if (isPgUniqueViolation(error))
          throw signupUserGeneratedEntitiesAlreadyTaken();
        throw error;
      }

      await signupEventProducer.publishOnboardingCompletedV1Event({
        signupUserId,
      });
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

async function generateUniqueOrganizationNames(
  signupDbService: SignupDbService,
) {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const lynxOrganizationName = generateRandomOrgName();
    const orionOrganizationName = generateRandomOrgName();

    if (lynxOrganizationName === orionOrganizationName) {
      continue;
    }

    const [lynxNameTaken, orionNameTaken] = await Promise.all([
      signupDbService.checkSignupOrganizationNameAlreadyTaken(
        lynxOrganizationName,
      ),
      signupDbService.checkSignupOrganizationNameAlreadyTaken(
        orionOrganizationName,
      ),
    ]);

    if (!lynxNameTaken && !orionNameTaken) {
      return {
        lynxOrganizationName,
        orionOrganizationName,
      };
    }
  }

  throw genericInternalError(
    "Failed to generate unique organization names after multiple attempts",
  );
}

function isPgUniqueViolation(
  error: unknown,
): error is DrizzleQueryError & { cause: DatabaseError } {
  return (
    error instanceof DrizzleQueryError &&
    error.cause instanceof DatabaseError &&
    error.cause?.code === PG_UNIQUE_VIOLATION
  );
}
