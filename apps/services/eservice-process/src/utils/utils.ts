import type { EserviceVersionId } from "@knodia/common-models/ids";

import {
  type Eservice,
  type EserviceVersion,
  type EserviceVersionState,
} from "@knodia/eservice-models";

import { eserviceVersionNotFound } from "../models/errors.ts";

export const findEserviceLatestVersion = (
  eservice: Eservice,
): EserviceVersion => {
  const latestVersion = eservice.versions
    .sort((a, b) => a.versionNumber - b.versionNumber)
    .at(-1);

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
