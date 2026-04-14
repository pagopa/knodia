import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  KeyId,
  OrganizationId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { ConsumerKeychainUser } from "@knodia/keychain-models";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import { UserRole } from "@knodia/common-models/auth";
import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  invalidUserRole,
  keyAlreadyExists,
  keychainMemberNotFound,
  notAllowedCertificate,
  purposeAlreadyLinkedToConsumerKeychain,
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

export function assertOrganizationIsPurposeConsumer(
  organizationId: OrganizationId,
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
    await readmodelService.getConsumerKeychainPurpose({
      consumerKeychainId,
      purpose,
    });

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

export function assertUserIsAllowedToPerformKeychainOperation(
  userId: UserId,
  keychainId: ConsumerKeychainId,
  members: ConsumerKeychainUser[],
): void {
  const isMember = members.some((member) => member.userId === userId);
  if (!isMember) {
    throw userNotAllowed(userId, keychainId);
  }
}

export function assertUserIsAllowedToRemoveKey(
  authData: UISessionAuthData,
  keychainId: ConsumerKeychainId,
  members: ConsumerKeychainUser[],
): void {
  const { userId, userRoles } = authData;

  if (userRoles.includes(UserRole.enum.administrative)) {
    return;
  }

  assertUserIsAllowedToPerformKeychainOperation(userId, keychainId, members);
}

export function assertUserIsMemberOfKeychain(
  userId: UserId,
  keychainId: ConsumerKeychainId,
  members: ConsumerKeychainUser[],
): void {
  const isMember = members.some((member) => member.userId === userId);
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
