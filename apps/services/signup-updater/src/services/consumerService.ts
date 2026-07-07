/* eslint-disable max-lines-per-function */
import type { Logger } from "pino";

import { UserRole } from "@knodia/common-models/auth";
import { genericInternalError } from "@knodia/common-models/errors";
import {
  type CorrelationId,
  KnodeId,
  type OrganizationId,
  type SignupUserId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  isPgUniqueViolation,
  rethrowSettledFailures,
} from "@knodia/common-models/utils";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  type SignupEventV1,
  type SignupUser,
  SignupUserStatus,
} from "@knodia/signup-models";
import { isAxiosError } from "axios";
import { match } from "ts-pattern";

import type { SignupUpdaterDeps } from "../utils/utils.ts";

import { externalOrganizationId } from "../utils/externalOrganizationId.ts";
import { getKnodiaServiceHeaders } from "../utils/headers.ts";

const HTTP_STATUS_CONFLICT = 409;

const TESTING_ORGANIZATION_ATTRIBUTE = {
  code: "testing_organization",
  scheme: "knodia",
} satisfies organizationProcessApi.Attribute;

export async function handleSignupMessage(
  event: SignupEventV1,
  deps: SignupUpdaterDeps,
  correlationId: CorrelationId,
  logger: Logger,
): Promise<void> {
  const signupUserId = event.data.signupUserId;

  return match(event)
    .with({ type: "OnboardingCompletedV1" }, async () => {
      const user = await deps.signupDbService.getSignupUserById(signupUserId);
      if (user === undefined) {
        // The row is gone. Only skip if the deletion registry confirms it was a
        // completed deletion: a missing user with no deletion record is an
        // unexpected invariant violation (e.g. a stale read on an eventually
        // consistent replica), so we throw and let the partition redeliver
        // rather than silently dropping a provisioning event.
        const deletion =
          await deps.signupDbService.getSignupUserDeletion(signupUserId);
        if (deletion === undefined) {
          throw genericInternalError(
            `Cannot handle OnboardingCompletedV1 for signup user ${signupUserId}: user not found and no deletion record`,
          );
        }
        logger.warn(
          `Skipping OnboardingCompletedV1 for signup user ${signupUserId}: user deleted at ${deletion.deletedAt.toISOString()}. Committing the offset; the event is obsolete and has no recovery path.`,
        );
        return;
      }

      if (!shouldProvisionOnOnboardingCompleted(user.status)) {
        logger.warn(
          `Skipping OnboardingCompletedV1 for signup user ${signupUserId}: user is ${user.status} (it left the onboarding flow before this provisioning event was consumed). Committing the offset.`,
        );
        return;
      }

      await forEachKnode(
        (knodeId) => provisionKnode(knodeId, user, deps, correlationId, logger),
        logger,
      );

      await deps.signupDbService.markSignupUserActive(signupUserId);
    })
    .with({ type: "EmailChangeRequestedV1" }, async (e) => {
      const emailChangeRequestId = e.data.emailChangeRequestId;
      const request =
        await deps.signupDbService.getEmailChangeRequestById(
          emailChangeRequestId,
        );

      if (request === undefined) {
        logger.info(
          `Skipping EmailChangeRequestedV1 ${emailChangeRequestId}: email change request no longer exists. Treating the message as already processed.`,
        );
        return;
      }

      if (request.signupUserId !== signupUserId) {
        throw genericInternalError(
          `EmailChangeRequestedV1 ${emailChangeRequestId} has mismatched signupUserId: expected ${request.signupUserId}, got ${signupUserId}. Treating the message as already processed.`,
        );
      }

      const user = await retrieveSignupUserOrLogMissingAndSkip(
        signupUserId,
        "EmailChangeRequestedV1",
        deps,
        logger,
      );

      if (user === undefined) {
        await deps.signupDbService.deleteEmailChangeRequest(
          emailChangeRequestId,
        );
        return;
      }

      try {
        await deps.signupDbService.updateSignupUserEmail({
          email: request.email,
          signupUserId: request.signupUserId,
        });
      } catch (error) {
        /**
         * This should not happen during the normal flow: the email is checked before
         * creating the change request.
         *
         * If it does happen, it means the target email was associated with another
         * signup user before this event was processed. Keep the request pending and
         * fail the message so the issue can be investigated and retried after the
         * underlying data conflict is resolved.
         */
        if (isPgUniqueViolation(error)) {
          logger.error(
            { err: error },
            `Failed to update email for signup user ${signupUserId}: requested email is already associated with another signup user. Keeping email change request ${emailChangeRequestId} pending for recovery.`,
          );
          throw genericInternalError(
            `Cannot process EmailChangeRequestedV1 ${emailChangeRequestId}: requested email is already associated with another signup user`,
          );
        }
        throw error;
      }

      // Update the email on every knode before resending, so the credential message reaches the new address.
      await forEachKnode(
        (knodeId) =>
          deps.knodeClients[knodeId].cognitoClient.updateUserEmail({
            email: request.email,
            username: user.generatedEntities[knodeId].userName,
          }),
        logger,
      );
      await resendCredentials(user, deps, logger);

      await deps.signupDbService.deleteEmailChangeRequest(emailChangeRequestId);
    })
    .with(
      { type: "DeletionRequestedV1" },
      { type: "MaintenanceUserDeletionRequestedV1" },
      async (e) => {
        const user = await retrieveSignupUserOrLogMissingAndSkip(
          signupUserId,
          e.type,
          deps,
          logger,
        );

        // The row is hard-deleted on completion, so a missing user means the saga
        // already finished (deletion-registry entry present) or the id never
        // existed. Reads hit the same primary the producer wrote DeletionPending
        // to before emitting the event, so a missing row isn't replication lag:
        // both cases are terminal. Log and commit instead of throwing, which would
        // redeliver forever and stall the whole partition.
        if (user === undefined) {
          const deletion = await deps.signupDbService.getSignupUserDeletion(
            e.data.signupUserId,
          );
          if (deletion === undefined) {
            logger.error(
              `Skipping ${e.type} for signup user ${e.data.signupUserId}: signup user not found and no deletion record. Committing the offset to avoid blocking the partition; the missing id needs investigating.`,
            );
          } else {
            logger.warn(
              `Skipping ${e.type} for signup user ${e.data.signupUserId}: deletion already completed`,
            );
          }
          return;
        }

        // The event is emitted only after the row is marked DeletionPending, so
        // any other status is a stale or out-of-order event. Skip rather than
        // delete the Cognito users of a user not marked for deletion and then
        // loop forever when completion finds no DeletionPending row.
        if (user.status !== SignupUserStatus.enum.DeletionPending) {
          logger.error(
            `Skipping ${e.type} for signup user ${user.signupUserId}: unexpected status ${user.status} (expected DeletionPending). Committing the offset to avoid blocking the partition.`,
          );
          return;
        }

        await forEachKnode(
          (knodeId) => deleteKnodeUser(knodeId, user, deps, logger),
          logger,
        );

        // Hard-deletes the row and writes the deletion-registry entry; idempotent
        // under at-least-once, so a crash before the offset commits replays safely.
        await deps.signupDbService.completeSignupUserDeletion(
          user.signupUserId,
        );
      },
    )
    .with({ type: "SuspensionRequestedV1" }, async () => {
      const user = await retrieveSignupUserOrLogMissingAndSkip(
        signupUserId,
        "SuspensionRequestedV1",
        deps,
        logger,
      );

      if (user === undefined) return;

      await forEachKnode(
        (knodeId) =>
          deps.knodeClients[knodeId].cognitoClient.disableUser({
            username: user.generatedEntities[knodeId].userName,
          }),
        logger,
      );
    })
    .with({ type: "MaintenanceUserReactivationRequestedV1" }, async () => {
      const user = await retrieveSignupUserOrLogMissingAndSkip(
        signupUserId,
        "MaintenanceUserReactivationRequestedV1",
        deps,
        logger,
      );

      if (user === undefined) return;

      await forEachKnode(
        (knodeId) =>
          deps.knodeClients[knodeId].cognitoClient.enableUser({
            username: user.generatedEntities[knodeId].userName,
          }),
        logger,
      );
    })
    .with({ type: "CredentialResetRequestedV1" }, async () => {
      const user = await retrieveSignupUserOrLogMissingAndSkip(
        signupUserId,
        "CredentialResetRequestedV1",
        deps,
        logger,
      );

      if (user === undefined) return;

      await resendCredentials(user, deps, logger);
    })
    .exhaustive();
}

async function createTestingOrganization(
  orgClient: OrganizationProcessClient,
  headers: ReturnType<typeof getKnodiaServiceHeaders>,
  name: string,
  organizationId: OrganizationId,
  knodeId: KnodeId,
): Promise<OrganizationId> {
  const { data } = await organizationProcessApi.createOrganization({
    body: {
      // Each organization gets a unique attribute (scheme = its Knode ID, code =
      // its name) on top of testing_organization, so e-services can require it to
      // restrict consumption to that single organization.
      attributes: [
        TESTING_ORGANIZATION_ATTRIBUTE,
        { code: name, scheme: knodeId },
      ],
      externalOrganizationId: organizationId,
      name,
    },
    client: orgClient,
    headers,
  });
  return unsafeBrandId<OrganizationId>(data.id);
}

// Organizations are intentionally not deleted on account deletion: per the
// signup design, only the Cognito users are removed. The orgs stay; once the
// signup row is hard-deleted their generated names are no longer available, but
// their ids remain recoverable by recomputing them from the signup user id (see
// externalOrganizationId).
async function deleteKnodeUser(
  knodeId: KnodeId,
  user: SignupUser,
  deps: SignupUpdaterDeps,
  logger: Logger,
): Promise<void> {
  const entities = user.generatedEntities[knodeId];
  const { cognitoClient } = deps.knodeClients[knodeId];
  const organizationId = externalOrganizationId(user.signupUserId, knodeId);

  logger.info(
    `Deleting Cognito user for signup user ${user.signupUserId} on ${knodeId}`,
  );

  try {
    // Idempotent inside the client: a missing user (UserNotFoundException) is
    // swallowed, so a replay after a partial deletion is safe.
    await cognitoClient.deleteOrganizationUser({ username: entities.userName });
  } catch (error) {
    // A corrupted record can fail AdminDeleteUser forever (seen on dev): redact
    // in place instead of stalling the partition on endless redeliveries.
    logger.warn(
      { err: error, knodeId },
      `Cognito delete failed for signup user ${user.signupUserId} on ${knodeId}; falling back to disable and redact`,
    );
    await cognitoClient.disableAndRedactOrganizationUser({
      organizationId,
      username: entities.userName,
    });
  }

  // The group is exclusive to this signup user (one per deterministic org id)
  // and each pool caps groups at 10000, so leaving it behind would eventually
  // exhaust the pool.
  await cognitoClient.deleteOrganizationGroup({ organizationId });
}

async function forEachKnode(
  action: (knodeId: KnodeId) => Promise<void>,
  logger: Logger,
): Promise<void> {
  const results = await Promise.allSettled(
    KnodeId.options.map(async (knodeId) => {
      try {
        await action(knodeId);
      } catch (error) {
        logger.error(
          { err: error, knodeId },
          `Knode action failed on ${knodeId}`,
        );
        throw error;
      }
    }),
  );

  rethrowSettledFailures(results);
}

// A 409 here means the org name is already taken by a different organization.
// The name is recoverable: it comes from the signup DB, not the event, so the
// collision can be fixed by correcting the name there and reprocessing.
//
// For now we don't block on it: an unresolved 409 retried under Kafka
// at-least-once would redeliver forever and stall every later event in the
// partition. So we skip the knode, log loudly, and let the offset commit.
//
// Recovery is then: fix the name in the signup DB and reprocess the topic from
// this offset onward. That's safe because provisioning is idempotent on the
// deterministic organization id (createOrganization returns the existing org
// for already-provisioned messages), so replaying earlier events is a no-op.
function isDuplicateOrganizationNameConflict(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === HTTP_STATUS_CONFLICT;
}

async function provisionKnode(
  knodeId: KnodeId,
  user: SignupUser,
  deps: SignupUpdaterDeps,
  correlationId: CorrelationId,
  logger: Logger,
): Promise<void> {
  const entities = user.generatedEntities[knodeId];
  const { cognitoClient, internalTokenProvider, orgClient } =
    deps.knodeClients[knodeId];
  const headers = getKnodiaServiceHeaders(
    correlationId,
    await internalTokenProvider.get(),
  );

  logger.info(
    `Provisioning organization and user for signup user ${user.signupUserId} on ${knodeId}`,
  );

  let organizationId: OrganizationId;
  try {
    organizationId = await createTestingOrganization(
      orgClient,
      headers,
      entities.organizationName,
      externalOrganizationId(user.signupUserId, knodeId),
      knodeId,
    );
  } catch (error) {
    if (isDuplicateOrganizationNameConflict(error)) {
      logger.error(
        { err: error },
        `Skipping provisioning for signup user ${user.signupUserId} on ${knodeId}: organization name "${entities.organizationName}" already taken by another organization. Committing the offset to avoid blocking the partition; recover by fixing the name in the signup DB and reprocessing the topic from this offset.`,
      );
      return;
    }
    throw error;
  }

  await cognitoClient.createOrganizationUser({
    email: user.email,
    organizationId,
    roles: [UserRole.enum.administrative, UserRole.enum.technical],
    username: entities.userName,
  });
}

// TODO(KN-848): dedup resend on Kafka retry — track last credential-send per user/knode
// so a reprocess doesn't email another temporary password.
async function resendCredentials(
  user: SignupUser,
  deps: SignupUpdaterDeps,
  logger: Logger,
): Promise<void> {
  await forEachKnode(
    (knodeId) =>
      deps.knodeClients[knodeId].cognitoClient.resetUserCredentials({
        username: user.generatedEntities[knodeId].userName,
      }),
    logger,
  );
}

async function retrieveSignupUserOrLogMissingAndSkip(
  signupUserId: SignupUserId,
  eventType: SignupEventV1["type"],
  deps: SignupUpdaterDeps,
  logger: Logger,
): Promise<SignupUser | undefined> {
  const user = await deps.signupDbService.getSignupUserById(signupUserId);

  if (user !== undefined) return user;

  const deletion =
    await deps.signupDbService.getSignupUserDeletion(signupUserId);
  if (deletion === undefined) {
    logger.error(
      `Skipping ${eventType} for signup user ${signupUserId}: signup user not found and no deletion record. Committing the offset to avoid blocking the partition; the missing id needs investigating.`,
    );
  } else {
    logger.warn(
      `Skipping ${eventType} for signup user ${signupUserId}: user deleted at ${deletion.deletedAt.toISOString()}. Committing the offset; the event is obsolete and has no recovery path.`,
    );
  }

  return undefined;
}

// Exhaustive so a new status forces a decision. Active is provisionable too: it
// may be only partially provisioned (409 path) and replay is idempotent. The rest
// left the onboarding flow before this event was consumed.
function shouldProvisionOnOnboardingCompleted(
  status: SignupUserStatus,
): boolean {
  return match(status)
    .with(
      SignupUserStatus.enum.OnboardingPending,
      SignupUserStatus.enum.Active,
      () => true,
    )
    .with(
      SignupUserStatus.enum.DeletionPending,
      SignupUserStatus.enum.Suspended,
      () => false,
    )
    .exhaustive();
}
