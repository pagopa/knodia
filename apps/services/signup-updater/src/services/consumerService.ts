import type { SignupEventV1, SignupUser } from "@knodia/signup-models";
import type { Logger } from "pino";

import { UserRole } from "@knodia/common-models/auth";
import {
  type CorrelationId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
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
  return match(event)
    .with({ type: "OnboardingCompletedV1" }, async (e) => {
      const user = await deps.signupDbService.getSignupUserById(
        e.data.signupUserId,
      );

      // For now we assume a missing user was deleted: nothing to provision, so we
      // skip the event (committing the offset) rather than blocking the partition.
      if (user === undefined) {
        logger.warn(
          `Skipping OnboardingCompletedV1 for signup user ${e.data.signupUserId}: user no longer exists (deleted). Committing the offset; the event is obsolete and has no recovery path.`,
        );
        return;
      }

      for (const knodeId of KnodeId.options) {
        await provisionKnode(knodeId, user, deps, correlationId, logger);
      }
    })
    .with({ type: "EmailChangeRequestedV1" }, async () => {
      throw new Error("EmailChangeRequestedV1 handling is not implemented");
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
