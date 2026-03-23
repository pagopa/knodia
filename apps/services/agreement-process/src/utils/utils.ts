import type { EserviceVersionId } from "@knodia/common-models/ids";
import type {
  Eservice,
  EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";

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

export const retrieveEserviceLatestVersionInAllowedStates = (
  eservice: Eservice,
  states: EserviceVersionState[],
) => {
  const eserviceLatestVersion = eservice.versions
    .filter((v) => states.includes(v.state))
    .reduce<EserviceVersion | undefined>((latest, current) => {
      if (!latest || current.versionNumber > latest.versionNumber) {
        return current;
      }
      return latest;
    }, undefined);

  if (!eserviceLatestVersion) {
    throw eserviceVersionNotFound(eservice.id);
  }

  return eserviceLatestVersion;
};
