import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";

import type { Eservice, EserviceVersion } from "./eservice.ts";

export const findEserviceLatestVersion = (
  eservice: Eservice,
  notFoundError: (eserviceId: EserviceId) => void,
): EserviceVersion => {
  const latestVersion = eservice.versions
    .toSorted((a, b) => b.versionNumber - a.versionNumber)
    .at(0);

  if (!latestVersion) {
    throw notFoundError(eservice.id);
  }

  return latestVersion;
};

export const findEserviceVersion = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  notFoundError: (
    eserviceId: EserviceId,
    eserviceVersionId: EserviceVersionId,
  ) => void,
) => {
  const eserviceVersion = eservice.versions.find(
    (version) => version.id === eserviceVersionId,
  );

  if (!eserviceVersion) {
    throw notFoundError(eservice.id, eserviceVersionId);
  }

  return eserviceVersion;
};
