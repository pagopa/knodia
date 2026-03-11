import type { OrganizationId } from "@knodia/common-models/ids";

import { forbiddenError } from "@knodia/fastify-zod-api-commons/models";

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
