import type {
  ConsumerKeychainId,
  KeyId,
  OrganizationId,
  UserId,
} from "@knodia/common-models/ids";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  invalidUserRole,
  keyAlreadyExists,
  keychainMemberNotFound,
  notAllowedCertificate,
  tooManyKeysPerKeychain,
  userNotAllowed,
  userNotFound,
} from "../models/errors.ts";
import {
  getOrganizationGroupName,
  TECHNICAL_ROLE_GROUP_NAME,
} from "../services/userService.ts";
import { isX509Certificate } from "./crypto.ts";

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

export function assertUserIsAllowedToPerformKeychainOperation(
  userId: UserId,
  keychainId: ConsumerKeychainId,
  members: UserId[],
): void {
  const isMember = members.includes(userId);
  if (!isMember) {
    throw userNotAllowed(userId, keychainId);
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

export const assertKeychainKeysCountIsBelowThreshold = (
  keychainId: ConsumerKeychainId,
  maxKeysPerKeychain: number,
  size: number,
): void => {
  if (size > maxKeysPerKeychain) {
    throw tooManyKeysPerKeychain(keychainId, size);
  }
};

export async function assertKeyIsUnique(
  kid: KeyId,
  keychainKeys: { kid: KeyId }[],
  readmodelService: ReadmodelService,
) {
  const alreadyExists =
    keychainKeys.some((key) => key.kid === kid) ||
    (await readmodelService.checkConsumerKeychainKeyExists(kid));

  if (alreadyExists) {
    throw keyAlreadyExists(kid);
  }
}

export function assertNotX509Certificate(key: string): void {
  if (isX509Certificate(key)) {
    throw notAllowedCertificate();
  }
}
