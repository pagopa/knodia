import type { OrganizationId } from "@knodia/common-models/ids";

import {
  type Eservice,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceVersionNotInExpectedStates,
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
