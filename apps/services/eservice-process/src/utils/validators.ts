import type { OrganizationId } from "@knodia/common-models/ids";

import { getCategory } from "@knodia/category-models";
import {
  type Eservice,
  type EserviceCategory,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceVersionNotInExpectedStates,
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

export const assertValidCategories = (categories: EserviceCategory[]): void => {
  for (const cat of categories) {
    if (getCategory(cat.scheme, cat.code) === undefined) {
      throw invalidCategory(cat.scheme, cat.code);
    }
  }
};

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
