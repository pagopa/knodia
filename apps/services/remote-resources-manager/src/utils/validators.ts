import type { AttributeId } from "@knodia/attribute-models";
import type { ExternalId } from "@knodia/common-models/externalResource";
import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";
import type { Organization } from "@knodia/organization-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerMissingRequiredAttributes,
  organizationNotFound,
} from "../models/errors.ts";

export function assertConsumerHasRequiredAttributes(
  consumerAttributes: readonly AttributeId[],
  requiredAttributes: k2kGatewayApi.RequiredAttributes,
  consumerId: OrganizationId,
  eserviceId: ExternalId<EserviceId>,
): void {
  const allRequired = requiredAttributes.flat();
  const hasAll = allRequired.every((requiredAtt) =>
    consumerAttributes.some(
      (consumerAtt) =>
        consumerAtt.code === requiredAtt.code &&
        consumerAtt.scheme === requiredAtt.scheme,
    ),
  );
  if (!hasAll) {
    throw consumerMissingRequiredAttributes(consumerId, eserviceId);
  }
}

export async function assertOrganizationExists(
  organizationId: OrganizationId,
  readmodelService: ReadmodelService,
): Promise<Organization> {
  const organization =
    await readmodelService.getOrganizationById(organizationId);
  if (organization === undefined) {
    throw organizationNotFound(organizationId);
  }
  return organization.data;
}
