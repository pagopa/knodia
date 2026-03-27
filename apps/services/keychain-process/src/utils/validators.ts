import type {
  ConsumerKeychainId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import {
  invalidUserRole,
  userNotFound,
  userNotMember,
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
    throw userNotMember(keychainId, userId);
  }
}
