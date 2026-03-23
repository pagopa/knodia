import type { OrganizationId } from "@knodia/common-models/ids";

import { genericError } from "@knodia/fastify-zod-api-commons/models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import { organizationNotFound } from "../models/errors.ts";

export function assertEntityExists<TEntity>(
  entity: TEntity | undefined,
  message: string,
): TEntity {
  if (entity === undefined) {
    throw genericError(message);
  }
  return entity;
}

export async function assertOrganizationExists(
  organizationId: OrganizationId,
  readmodelService: ReadmodelService,
): Promise<void> {
  const organization =
    await readmodelService.getOrganizationById(organizationId);
  if (organization === undefined) {
    throw organizationNotFound(organizationId);
  }
}
