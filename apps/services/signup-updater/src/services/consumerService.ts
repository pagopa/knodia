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
import {
  organizationProcessApi,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import { isAxiosError } from "axios";
import { match } from "ts-pattern";

import type { SignupUpdaterDeps } from "../utils/utils.ts";

import { getKnodiaServiceHeaders } from "../utils/headers.ts";

const TESTING_ORGANIZATION_ATTRIBUTE = {
  code: "testing_organization",
  scheme: "knodia",
};

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
      assertSignupUserExists(user, e.data.signupUserId);

      for (const knodeId of KnodeId.options) {
        await provisionKnode(knodeId, user, deps, correlationId, logger);
      }
    })
    .exhaustive();
}

function assertSignupUserExists(
  user: SignupUser | undefined,
  signupUserId: SignupUserId,
): asserts user is SignupUser {
  if (user === undefined) {
    throw genericInternalError(`Signup user not found: ${signupUserId}`);
  }
}

async function createTestingOrganization(
  orgClient: OrganizationProcessClient,
  headers: ReturnType<typeof getKnodiaServiceHeaders>,
  name: string,
): Promise<OrganizationId | undefined> {
  try {
    const { data } = await organizationProcessApi.createOrganization({
      body: {
        attributes: [TESTING_ORGANIZATION_ATTRIBUTE],
        name,
      },
      client: orgClient,
      headers,
    });
    return unsafeBrandId<OrganizationId>(data.id);
  } catch (error) {
    if (isConflictError(error)) {
      return undefined;
    }
    throw error;
  }
}

function isConflictError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}

async function provisionKnode(
  knodeId: KnodeId,
  user: SignupUser,
  deps: SignupUpdaterDeps,
  correlationId: CorrelationId,
  logger: Logger,
): Promise<void> {
  const entities = user.generatedEntities[knodeId];
  const { cognitoClient, orgClient } = deps.nodeClients[knodeId];
  const headers = getKnodiaServiceHeaders(
    correlationId,
    await deps.internalTokenProvider.get(),
  );

  const organizationId = await createTestingOrganization(
    orgClient,
    headers,
    entities.organizationName,
  );
  // undefined = 409 from organization-process: org names are unique per signup
  // user, so this same user's org already exists (redelivery) → skip.
  if (organizationId === undefined) {
    logger.info(
      `Organization "${entities.organizationName}" already exists on ${knodeId}; skipping (already processed)`,
    );
    return;
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
