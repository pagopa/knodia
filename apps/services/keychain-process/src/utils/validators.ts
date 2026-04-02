import type {
  ExternalId,
  ExternalResource,
} from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  OrganizationId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  invalidUserRole,
  keychainMemberNotFound,
  purposeAlreadyLinkedToConsumerKeychain,
  userNotFound,
} from "../models/errors.ts";
import {
  getOrganizationGroupName,
  TECHNICAL_ROLE_GROUP_NAME,
} from "../services/userService.ts";

export function assertOrganizationIsKeychainOwner(
  organizationId: OrganizationId,
  keychain: { ownerId: OrganizationId },
): void {
  if (keychain.ownerId !== organizationId) {
    throw forbiddenError(
      `Caller organization ${organizationId} is not the owner of the keychain`,
    );
  }
}

export function assertOrganizationIsPurposeConsumer(
  organizationId: ExternalId<OrganizationId>,
  purpose: Pick<remoteResourcesManagerApi.Purpose, "consumer">,
): void {
  if (purpose.consumer.id !== organizationId) {
    throw forbiddenError(
      `Caller organization ${organizationId} is not the Consumer of the Purpose`,
    );
  }
}

export async function assertPurposeIsNotLinkedToConsumerKeychain(
  consumerKeychainId: ConsumerKeychainId,
  purpose: ExternalResource<PurposeId>,
  readmodelService: ReadmodelService,
): Promise<void> {
  const consumerKeychainPurpose =
    await readmodelService.getConsumerKeychainPurpose(
      consumerKeychainId,
      purpose,
    );

  if (consumerKeychainPurpose) {
    throw purposeAlreadyLinkedToConsumerKeychain(consumerKeychainId, purpose);
  }
}

export function assertUserBelongsToOrganization(
  userId: UserId,
  organizationId: OrganizationId,
  userGroups: string[],
): void {
  const organizationGroupName = getOrganizationGroupName(organizationId);
  if (!userGroups.includes(organizationGroupName)) {
    throw userNotFound(userId);
  }
}

export function assertUserHasTechnicalRole(
  userId: UserId,
  userGroups: string[],
): void {
  if (!userGroups.includes(TECHNICAL_ROLE_GROUP_NAME)) {
    throw invalidUserRole(userId, TECHNICAL_ROLE_GROUP_NAME);
  }
}

export function assertUserIsMemberOfKeychain(
  userId: UserId,
  keychainId: ConsumerKeychainId,
  members: UserId[],
): void {
  const isMember = members.includes(userId);
  if (!isMember) {
    throw keychainMemberNotFound(keychainId, userId);
  }
}
