import {
  type Eservice,
  type EserviceVersion,
  findEserviceLatestVersion,
} from "@knodia/eservice-models";

import { eserviceLatestVersionNotFound } from "../models/errors.ts";

export const retrieveEserviceLatestVersion = (
  eservice: Eservice,
): EserviceVersion => {
  const latestVersion = findEserviceLatestVersion(eservice);

  if (!latestVersion) {
    throw eserviceLatestVersionNotFound(eservice.id);
  }

  return latestVersion;
};
