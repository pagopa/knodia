import { genericInternalError } from "@knodia/common-models/errors";

import type { Eservice, EserviceVersion } from "./eservice.ts";

export const getLatestVersion = (eservice: Eservice): EserviceVersion => {
  const latestVersion = eservice.versions.toSorted(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
  if (!latestVersion) {
    throw genericInternalError(`Eservice ${eservice.id} has no versions`);
  }
  return latestVersion;
};
