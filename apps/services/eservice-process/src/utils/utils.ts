import type { EserviceVersionId } from "@knodia/common-models/ids";

import {
  type Eservice,
  type EserviceVersion,
  type EserviceVersionState,
  findEserviceLatestVersion,
} from "@knodia/eservice-models";

import { eserviceVersionNotFound } from "../models/errors.ts";

export const retrieveEserviceLatestVersionFromEservice = (
  eservice: Eservice,
): EserviceVersion => {
  const latestVersion = findEserviceLatestVersion(eservice);

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
