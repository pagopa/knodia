/* eslint-disable max-lines-per-function */
import type { SignupDbService } from "@knodia/db-signup/services";
import type { UISignupSessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import { genericInternalError } from "@knodia/common-models/errors";
import {
  type EmailChangeRequestId,
  generateId,
  type SignupUserId,
} from "@knodia/common-models/ids";
import { isPgUniqueViolation } from "@knodia/common-models/utils";
import {
  type SignupUser,
  SignupUserStatus,
  type SuspensionReason,
} from "@knodia/signup-models";

import type {
  API_ChangeEmailRequestBody,
  API_ConfirmOnboardingRequestBody,
} from "../models/api.ts";
import type { SignupEventProducer } from "./signupEventProducer.ts";

import {
  signupUserAlreadyHasPendingEmailChangeRequest,
  signupUserEmailChangeRequestCreationConflict,
  signupUserGeneratedEntitiesAlreadyExist,
  signupUserNotFound,
} from "../models/errors.ts";
import { generateRandomOrgName, toUserName } from "../utils/nameGenerator.ts";
import {
  computeTermsAcceptanceDigest,
  TERMS_AND_CONDITIONS_VERSION,
} from "../utils/termsAcceptance.ts";
import {
  assertSignupUserEmailDoesNotExist,
  assertSignupUserIdentifiersDoNotExist,
  assertSignupUserIsActive,
  assertSignupUserIsOnboarded,
  assertSignupUserIsSuspended,
} from "../utils/validators.ts";

export type SignupService = ReturnType<typeof signupServiceBuilder>;

export function signupServiceBuilder(
  signupDbService: SignupDbService,
  signupEventProducer: SignupEventProducer,
) {
  return {
    async changeEmail(
      { email }: API_ChangeEmailRequestBody,
      { authData }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      const currentSignupUser =
        await signupDbService.getUniqueSignupUserByIdentifiers({
          fiscalNumber: authData.fiscalNumber,
          personIdentifier: authData.personIdentifier,
          spidCode: authData.spidCode,
        });

      assertSignupUserIsOnboarded(currentSignupUser);
      await assertSignupUserEmailDoesNotExist(email, signupDbService);

      const signupUserEmailChangeRequestAlreadyExists =
        await signupDbService.checkSignupUserEmailChangeRequestExists(
          currentSignupUser.signupUserId,
        );

      if (signupUserEmailChangeRequestAlreadyExists) {
        throw signupUserAlreadyHasPendingEmailChangeRequest();
      }

      const emailChangeRequestId = generateId<EmailChangeRequestId>();

      try {
        await signupDbService.insertEmailChangeRequest({
          createdAt: new Date(),
          email,
          emailChangeRequestId,
          signupUserId: currentSignupUser.signupUserId,
        });
      } catch (error) {
        if (isPgUniqueViolation(error)) {
          throw signupUserEmailChangeRequestCreationConflict();
        }
        throw error;
      }

      await signupEventProducer.publishEmailChangeRequestedV1Event({
        emailChangeRequestId,
        signupUserId: currentSignupUser.signupUserId,
      });
    },

    async confirmOnboarding(
      { email }: API_ConfirmOnboardingRequestBody,
      { authData }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      const now = new Date();
      const signupUserId = generateId<SignupUserId>();
      const termsAcceptanceDigest = computeTermsAcceptanceDigest(now);

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
          throw signupUserGeneratedEntitiesAlreadyExist();
        throw error;
      }

      await signupEventProducer.publishOnboardingCompletedV1Event({
        occurredAt: now.toISOString(),
        oneIdNonce: authData.oneIdNonce,
        signupUserId,
        termsAcceptanceDigest,
        termsAcceptanceVersion: TERMS_AND_CONDITIONS_VERSION,
      });
    },
    async deleteCurrentSignupUser({
      authData,
    }: AuthorizedContext<UISignupSessionAuthData>): Promise<void> {
      const user = await signupDbService.getUniqueSignupUserByIdentifiers({
        fiscalNumber: authData.fiscalNumber,
        personIdentifier: authData.personIdentifier,
        spidCode: authData.spidCode,
      });

      if (user === undefined) {
        throw signupUserNotFound();
      }

      /**
       * Mark the row DeletionPending BEFORE publishing: if the publish fails the
       * row stays DeletionPending and a retried POST republishes (the mark is an
       * idempotent no-op once pending). Retries differ only in occurredAt; the
       * event identity (signupUserId + oneIdNonce) is stable and deduplication is
       * downstream on the signupUserId Kafka key plus idempotent consumers.
       */
      await signupDbService.markSignupUserDeletionPending(user.signupUserId);

      await signupEventProducer.publishDeletionRequestedV1Event({
        occurredAt: new Date().toISOString(),
        oneIdNonce: authData.oneIdNonce,
        signupUserId: user.signupUserId,
      });
    },
    async getCurrentSignupUser({
      authData,
    }: AuthorizedContext<UISignupSessionAuthData>): Promise<
      SignupUser | undefined
    > {
      return await signupDbService.getUniqueSignupUserByIdentifiers({
        fiscalNumber: authData.fiscalNumber,
        personIdentifier: authData.personIdentifier,
        spidCode: authData.spidCode,
      });
    },
    async reactivateUser({ signupUserId }: { signupUserId: SignupUserId }) {
      const userToReactivate =
        await signupDbService.getSignupUserById(signupUserId);

      if (!userToReactivate) {
        throw signupUserNotFound();
      }

      assertSignupUserIsOnboarded(userToReactivate);
      assertSignupUserIsSuspended(userToReactivate);

      const now = new Date();
      await signupDbService.updateSignupUserReactivation(signupUserId);

      await signupEventProducer.publishMaintenanceUserReactivationRequestedV1Event(
        {
          occurredAt: now.toISOString(),
          oneIdNonce: generateId(),
          signupUserId,
        },
      );
    },
    async suspendUser(
      { suspensionReason }: { suspensionReason: SuspensionReason },
      { authData }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      const currentSignupUser =
        await signupDbService.getUniqueSignupUserByIdentifiers({
          fiscalNumber: authData.fiscalNumber,
          personIdentifier: authData.personIdentifier,
          spidCode: authData.spidCode,
        });

      assertSignupUserIsOnboarded(currentSignupUser);
      assertSignupUserIsActive(currentSignupUser);

      const now = new Date();
      await signupDbService.updateSignupUserSuspension({
        signupUserId: currentSignupUser.signupUserId,
        suspendedAt: now,
        suspensionReason,
      });

      await signupEventProducer.publishSuspensionRequestedV1Event({
        occurredAt: now.toISOString(),
        oneIdNonce: authData.oneIdNonce,
        signupUserId: currentSignupUser.signupUserId,
        suspensionReason,
      });
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
