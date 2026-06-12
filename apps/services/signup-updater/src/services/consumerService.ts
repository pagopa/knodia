import type { SignupEventV1, SignupUser } from "@knodia/signup-models";
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
import { isPgUniqueViolation } from "@knodia/common-models/utils";
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
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

  async function retrieveSignupUserOrWarn(
    signupUserId: SignupUserId,
  ): Promise<SignupUser | undefined> {
    const user = await deps.signupDbService.getSignupUserById(signupUserId);

    // For now we assume a missing user was deleted: nothing to provision, so we
    // skip the event (committing the offset) rather than blocking the partition.
    if (user === undefined) {
      logger.warn(
        `Skipping event for signup user ${signupUserId}: user no longer exists (deleted). Deleting the email change request and committing the offset; the event is obsolete and has no recovery path.`,
      );
    }

    return user;
  }

  return match(event)
    .with({ type: "OnboardingCompletedV1" }, async () => {
      const user = await retrieveSignupUserOrWarn(signupUserId);
      if (user === undefined) return;

      for (const knodeId of KnodeId.options) {
        await provisionKnode(knodeId, user, deps, correlationId, logger);
      }
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

      const user = await retrieveSignupUserOrWarn(signupUserId);

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
            `Failed to update email for signup user ${signupUserId}: requested email is already associated with another signup user. Keeping email change request ${emailChangeRequestId} pending for recovery.`,
          );
          throw genericInternalError(
            `Cannot process EmailChangeRequestedV1 ${emailChangeRequestId}: requested email is already associated with another signup user`,
          );
        }
        throw error;
      }

      for (const knodeId of KnodeId.options) {
        await deps.knodeClients[knodeId].cognitoClient.updateUserEmail({
          email: request.email,
          username: user.generatedEntities[knodeId].userName,
        });
      }

      await deps.signupDbService.deleteEmailChangeRequest(emailChangeRequestId);
    })
    .with({ type: "DeletionRequestedV1" }, async () => {
      // TODO: implement deletion handling
    })
    .exhaustive();
}

async function createTestingOrganization(
  orgClient: OrganizationProcessClient,
  headers: ReturnType<typeof getKnodiaServiceHeaders>,
  name: string,
  organizationId: OrganizationId,
): Promise<OrganizationId> {
  const { data } = await organizationProcessApi.createOrganization({
    body: {
      attributes: [TESTING_ORGANIZATION_ATTRIBUTE],
      externalOrganizationId: organizationId,
      name,
    },
    client: orgClient,
    headers,
  });
  return unsafeBrandId<OrganizationId>(data.id);
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
    );
  } catch (error) {
    if (isDuplicateOrganizationNameConflict(error)) {
      logger.error(
        `Skipping provisioning for signup user ${user.signupUserId} on ${knodeId}: organization name "${entities.organizationName}" already taken by another organization. Committing the offset to avoid blocking the partition; recover by fixing the name in the signup DB and reprocessing the topic from this offset.`,
      );
      return;
    }
    throw error;
  }

  await cognitoClient.createOrganizationUser({
    email: user.email,
    familyName: user.familyName,
    givenName: user.name,
    organizationId,
    roles: [UserRole.enum.administrative, UserRole.enum.technical],
    username: entities.userName,
  });
}
