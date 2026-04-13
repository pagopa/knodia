import type {
  EserviceVersionId,
  OrganizationId,
} from "@knodia/common-models/ids";

import {
  type Eservice,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceVersionNotFound,
  eserviceVersionNotInExpectedStates,
  notEserviceProducer,
  organizationNotFound,
} from "../models/errors.ts";

export const findEserviceLatestVersion = (
  eservice: Eservice,
): EserviceVersion => {
  const latestVersion = eservice.versions.reduce<EserviceVersion | undefined>(
    (max, cur) =>
      max === undefined || cur.versionNumber > max.versionNumber ? cur : max,
    undefined,
  );

  if (!latestVersion) {
    throw eserviceVersionNotFound(eservice.id);
  }

  return latestVersion;
};

export const updateEserviceVersionState = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  newState: EserviceVersionState,
  now: Date,
): Eservice => ({
  ...eservice,
  updatedAt: now,
  versions: eservice.versions.map((v) =>
    v.id === eserviceVersionId ? { ...v, state: newState, updatedAt: now } : v,
  ),
});

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
