/* eslint-disable max-lines-per-function */
import type { SignupDbService } from "@knodia/db-signup/services";
import type {
  InternalAuthData,
  UISignupSessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
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
  signupUserIdentifierAlreadyAssociated,
  signupUserNotFound,
} from "../models/errors.ts";
import { generateRandomOrgName, toUserName } from "../utils/nameGenerator.ts";
import {
  computeTermsAcceptanceDigest,
  TERMS_AND_CONDITIONS_VERSION,
} from "../utils/termsAcceptance.ts";
import {
  assertSignupUserEmailDoesNotExist,
  assertSignupUserIsActive,
  assertSignupUserIsOnboarded,
  assertSignupUserIsSuspended,
} from "../utils/validators.ts";

export type SignupService = ReturnType<typeof signupServiceBuilder>;

export function signupServiceBuilder(
  signupDbService: SignupDbService,
  signupEventProducer: SignupEventProducer,
) {
  const retrieveCurrentActiveSignupUser = async (
    authData: UISignupSessionAuthData,
  ) => {
    const user = await signupDbService.getUniqueSignupUserByIdentifiers({
      fiscalNumber: authData.fiscalNumber,
      personIdentifier: authData.personIdentifier,
      spidCode: authData.spidCode,
    });
    assertSignupUserIsOnboarded(user);
    assertSignupUserIsActive(user);
    return user;
  };

  return {
    async changeEmail(
      { email }: API_ChangeEmailRequestBody,
      { authData, logger }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      logger.info("Requesting email change for current signup user");

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
      { authData, logger }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      logger.info("Confirming onboarding for current signup user");

      const existingSignupUser =
        await signupDbService.getUniqueSignupUserByIdentifiers({
          fiscalNumber: authData.fiscalNumber,
          personIdentifier: authData.personIdentifier,
          spidCode: authData.spidCode,
        });

      if (existingSignupUser) {
        await resolveRepeatedConfirmOnboarding(
          existingSignupUser,
          authData,
          signupEventProducer,
        );
        return;
      }

      await createOnboardingPendingUser(
        email,
        authData,
        signupDbService,
        signupEventProducer,
      );
    },
    async deleteCurrentSignupUser({
      authData,
      logger,
    }: AuthorizedContext<UISignupSessionAuthData>): Promise<void> {
      logger.info("Requesting deletion of current signup user");

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
      logger,
    }: AuthorizedContext<UISignupSessionAuthData>): Promise<
      SignupUser | undefined
    > {
      logger.info("Getting current signup user");

      return await signupDbService.getUniqueSignupUserByIdentifiers({
        fiscalNumber: authData.fiscalNumber,
        personIdentifier: authData.personIdentifier,
        spidCode: authData.spidCode,
      });
    },
    async maintenanceDeleteUser(
      {
        signupUserId,
      }: {
        signupUserId: SignupUserId;
      },
      { logger }: AuthorizedContext<InternalAuthData>,
    ) {
      logger.info(
        `Requesting maintenance deletion for signup user ${signupUserId}`,
      );
      const userToDelete =
        await signupDbService.getSignupUserById(signupUserId);

      if (userToDelete === undefined) {
        throw signupUserNotFound();
      }

      await signupDbService.markSignupUserDeletionPending(signupUserId);

      await signupEventProducer.publishMaintenanceUserDeletionRequestedV1Event({
        occurredAt: new Date().toISOString(),
        signupUserId,
      });
    },
    async reactivateUser(
      { signupUserId }: { signupUserId: SignupUserId },
      { logger }: AuthorizedContext<InternalAuthData>,
    ) {
      logger.info(
        `Requesting maintenance reactivation for signup user ${signupUserId}`,
      );

      const userToReactivate =
        await signupDbService.getSignupUserById(signupUserId);

      assertSignupUserIsOnboarded(userToReactivate);
      assertSignupUserIsSuspended(userToReactivate);

      const now = new Date();

      await signupDbService.updateSignupUserReactivation(signupUserId);

      await signupEventProducer.publishMaintenanceUserReactivationRequestedV1Event(
        {
          occurredAt: now.toISOString(),
          signupUserId,
        },
      );
    },
    async resetCredentials({
      authData,
      logger,
    }: AuthorizedContext<UISignupSessionAuthData>) {
      logger.info("Requesting credential reset for current signup user");

      const currentSignupUser = await retrieveCurrentActiveSignupUser(authData);

      await signupEventProducer.publishCredentialResetRequestedV1Event({
        occurredAt: new Date().toISOString(),
        oneIdNonce: authData.oneIdNonce,
        signupUserId: currentSignupUser.signupUserId,
      });
    },
    async suspendUser(
      { suspensionReason }: { suspensionReason: SuspensionReason },
      { authData, logger }: AuthorizedContext<UISignupSessionAuthData>,
    ) {
      logger.info("Requesting suspension for current signup user");

      const currentSignupUser = await retrieveCurrentActiveSignupUser(authData);

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

async function createOnboardingPendingUser(
  email: string,
  authData: UISignupSessionAuthData,
  signupDbService: SignupDbService,
  signupEventProducer: SignupEventProducer,
): Promise<void> {
  const now = new Date();
  const signupUserId = generateId<SignupUserId>();
  const termsAcceptanceDigest = computeTermsAcceptanceDigest(now);

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
    status: SignupUserStatus.enum.OnboardingPending,
    updatedAt: now,
  };

  try {
    await signupDbService.insertSignupUser(newSignupUser);
  } catch (error) {
    // Pre-insert uniqueness checks aren't transactional; map a concurrent
    // unique-violation to 409 instead of a generic 500.
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

/**
 * The row is still OnboardingPending — either the OnboardingCompletedV1 publish
 * failed, or it succeeded but signup-updater hasn't provisioned the user yet. Either
 * way we re-emit the event (occurredAt and digest reproduced from the stored
 * createdAt) instead of returning 409 and stranding the user; a duplicate event is
 * harmless because the updater's provisioning is idempotent. Any other status is an
 * identity conflict.
 *
 * Returning in a fresh OneID session (new nonce) re-emits under that nonce and the
 * first-provided email — so the archive may get a duplicate acceptance record, and a
 * changed email in this repeated request is ignored. We accept it: rare, the
 * acceptance is never lost, and the first email was confirmed.
 */
async function resolveRepeatedConfirmOnboarding(
  existingSignupUser: SignupUser,
  authData: UISignupSessionAuthData,
  signupEventProducer: SignupEventProducer,
): Promise<void> {
  if (existingSignupUser.status !== SignupUserStatus.enum.OnboardingPending) {
    throw signupUserIdentifierAlreadyAssociated();
  }

  await signupEventProducer.publishOnboardingCompletedV1Event({
    occurredAt: existingSignupUser.createdAt.toISOString(),
    oneIdNonce: authData.oneIdNonce,
    signupUserId: existingSignupUser.signupUserId,
    termsAcceptanceDigest: computeTermsAcceptanceDigest(
      existingSignupUser.createdAt,
    ),
    termsAcceptanceVersion: TERMS_AND_CONDITIONS_VERSION,
  });
}
