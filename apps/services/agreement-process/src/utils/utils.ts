import type { EserviceVersionId } from "@knodia/common-models/ids";
import type { Eservice, EserviceVersion } from "@knodia/eservice-models";

import { eserviceVersionNotFound } from "../models/errors.ts";

export const retrieveEserviceVersionFromEservice = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
) => {
  const eserviceVersion = eservice.versions.find(
    (version) => version.id === eserviceVersionId,
  );

  if (!eserviceVersion) {
    throw eserviceVersionNotFound(eservice.id, eserviceVersionId);
  }

  return eserviceVersion;
};

export const retrieveEserviceLatestVersion = (
  eservice: Eservice,
): EserviceVersion => {
  const eserviceLatestVersion = eservice.versions
    .toSorted((a, b) => b.versionNumber - a.versionNumber)
    .at(0);

  if (!eserviceLatestVersion) {
    throw eserviceVersionNotFound(eservice.id);
  }

  return eserviceLatestVersion;
};
