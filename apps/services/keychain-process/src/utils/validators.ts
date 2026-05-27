import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  EserviceId,
  KeyId,
  KnodeApiKeychainId,
  OrganizationId,
  ProducerKeychainId,
  PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { KeychainUser } from "@knodia/keychain-models";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import { UserRole } from "@knodia/common-models/auth";
import { isX509Certificate } from "@knodia/crypto";
import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceAlreadyLinkedToProducerKeychain,
  invalidUserRole,
  keyAlreadyExists,
  keychainMemberNotFound,
  notAllowedCertificate,
  purposeAlreadyLinkedToConsumerKeychain,
  tooManyKeysPerKeychain,
  userNotAllowed,
  userNotFound,
} from "../models/errors.ts";

export async function assertEserviceIsNotLinkedToProducerKeychain(
  producerKeychainId: ProducerKeychainId,
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
): Promise<void> {
  const producerKeychainEservice =
    await readmodelService.getProducerKeychainEservice({
      eserviceId,
      producerKeychainId,
    });

  if (producerKeychainEservice) {
    throw eserviceAlreadyLinkedToProducerKeychain(
      producerKeychainId,
      eserviceId,
    );
  }
}

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

export async function assertUserBelongsToOrganization(
  user: IdmUser,
  organizationId: OrganizationId,
  cognitoIdmClient: CognitoIdmClient,
): Promise<void> {
  if (
    !(await cognitoIdmClient.checkUserBelongsToOrganization(
      user,
      organizationId,
    ))
  ) {
    throw userNotFound(user.id);
  }
}

export function assertUserHasTechnicalRole(user: IdmUser): void {
  if (!user.roles.includes(UserRole.enum.technical)) {
    throw invalidUserRole(user.id, UserRole.enum.technical);
  }
}

export function assertUserIsAllowedToPerformKeychainOperation(
  userId: UserId,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
  members: KeychainUser[],
): void {
  const isMember = members.some((member) => member.userId === userId);
  if (!isMember) {
    throw userNotAllowed(userId, keychainId);
  }
}

export function assertUserIsAllowedToRemoveKey(
  authData: UISessionAuthData,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
  members: KeychainUser[],
): void {
  const { userId, userRoles } = authData;

  if (userRoles.includes(UserRole.enum.administrative)) {
    return;
  }

  assertUserIsAllowedToPerformKeychainOperation(userId, keychainId, members);
}

export function assertUserIsMemberOfKeychain(
  userId: UserId,
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
  members: KeychainUser[],
): void {
  const isMember = members.some((member) => member.userId === userId);
  if (!isMember) {
    throw keychainMemberNotFound(keychainId, userId);
  }
}

export const assertKeychainKeysCountIsBelowThreshold = (
  keychainId: ConsumerKeychainId | KnodeApiKeychainId | ProducerKeychainId,
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
  const [
    consumerKeychainKeyExists,
    knodeApiKeychainKeyExists,
    producerKeychainKeyExists,
  ] = await Promise.all([
    readmodelService.checkConsumerKeychainKeyExists(kid),
    readmodelService.checkKnodeApiKeychainKeyExists(kid),
    readmodelService.checkProducerKeychainKeyExists(kid),
  ]);

  const alreadyExists =
    keychainKeys.some((key) => key.kid === kid) ||
    consumerKeychainKeyExists ||
    knodeApiKeychainKeyExists ||
    producerKeychainKeyExists;

  if (alreadyExists) {
    throw keyAlreadyExists(kid);
  }
}

export function assertNotX509Certificate(key: string): void {
  if (isX509Certificate(key)) {
    throw notAllowedCertificate();
  }
}
