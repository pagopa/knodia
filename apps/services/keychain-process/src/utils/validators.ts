import type { ExternalId } from "@knodia/common-models/externalResource";
import type {
  ConsumerKeychainId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { purposeAlreadyLinkedToConsumerKeychain } from "../models/errors.ts";
import { retrieveConsumerKeychainPurpose } from "./readmodelUtils.ts";

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
  purposeId: ExternalId<PurposeId>,
  readmodelService: ReadmodelService,
): Promise<void> {
  const consumerKeychainPurpose = await retrieveConsumerKeychainPurpose(
    consumerKeychainId,
    purposeId,
    readmodelService,
  );

  if (consumerKeychainPurpose) {
    throw purposeAlreadyLinkedToConsumerKeychain(consumerKeychainId, purposeId);
  }
}
