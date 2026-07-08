import type {
  EserviceId,
  KnodeId,
  OrganizationId,
} from "@knodia/common-models/ids";
import type { ExternalUISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";

import { getCategory } from "@knodia/category-models";
import {
  type Eservice,
  type EserviceCategory,
  type EserviceVersion,
  EserviceVersionState,
  type LocalizedName,
} from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  duplicateEserviceName,
  eserviceTemplateInstanceFieldsCannotBeUpdated,
  eserviceTokenClaimMismatch,
  eserviceVersionNotInExpectedStates,
  type ExternalUISessionEserviceClaimField,
  invalidCategory,
  notEserviceProducer,
  organizationNotFound,
} from "../models/errors.ts";

export const assertIsEserviceProducer = (
  eservice: Eservice,
  organizationId: OrganizationId,
): void => {
  if (eservice.producerId !== organizationId) {
    throw notEserviceProducer(eservice.id, organizationId);
  }
};

export const assertCategoriesCanBeUpdated = (eservice: Eservice): void => {
  if (eservice.template !== undefined) {
    throw eserviceTemplateInstanceFieldsCannotBeUpdated(
      eservice.id,
      eservice.template.id,
      ["categories"],
    );
  }
};

export const assertEserviceVersionIsActive = (
  eservice: Eservice,
  eserviceVersion: EserviceVersion,
): void => {
  if (eserviceVersion.state !== EserviceVersionState.enum.Active) {
    throw eserviceVersionNotInExpectedStates(eservice.id, eserviceVersion.id, [
      EserviceVersionState.enum.Active,
    ]);
  }
};

export const assertEserviceVersionIsSuspended = (
  eservice: Eservice,
  eserviceVersion: EserviceVersion,
): void => {
  if (eserviceVersion.state !== EserviceVersionState.enum.Suspended) {
    throw eserviceVersionNotInExpectedStates(eservice.id, eserviceVersion.id, [
      EserviceVersionState.enum.Suspended,
    ]);
  }
};

export const assertValidCategories = (
  categories: EserviceCategory[] | undefined,
): void => {
  for (const cat of categories ?? []) {
    if (getCategory(cat.scheme, cat.code) === undefined) {
      throw invalidCategory(cat.scheme, cat.code);
    }
  }
};

export async function assertEserviceNameIsUnique({
  excludeEserviceId,
  name,
  producerId,
  readmodelService,
}: {
  excludeEserviceId?: EserviceId;
  name: LocalizedName;
  producerId: OrganizationId;
  readmodelService: ReadmodelService;
}): Promise<void> {
  const exists = await readmodelService.eserviceWithNameExists({
    excludeEserviceId,
    name,
    producerId,
  });
  if (exists) {
    throw duplicateEserviceName(name, producerId);
  }
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

export function assertTokenEserviceClaimsMatchPathParam(
  authData: ExternalUISessionAuthData,
  pathEserviceId: EserviceId,
  thisKnodeId: KnodeId,
): void {
  const checks: {
    expectedValue: string;
    field: ExternalUISessionEserviceClaimField;
    tokenValue: string;
  }[] = [
    {
      expectedValue: pathEserviceId,
      field: "eservice.id",
      tokenValue: authData.eservice.id,
    },
    {
      expectedValue: thisKnodeId,
      field: "eservice.knodeId",
      tokenValue: authData.eservice.knodeId,
    },
  ];

  for (const { expectedValue, field, tokenValue } of checks) {
    if (tokenValue !== expectedValue) {
      throw eserviceTokenClaimMismatch(field, tokenValue, expectedValue);
    }
  }
}
