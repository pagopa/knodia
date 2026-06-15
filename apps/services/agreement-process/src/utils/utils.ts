import type { EserviceVersionId } from "@knodia/common-models/ids";

import {
  type Eservice,
  type EserviceVersion,
  findEserviceLatestVersion,
  findEserviceVersion,
} from "@knodia/eservice-models";

import { eserviceVersionNotFound } from "../models/errors.ts";

export const retrieveEserviceVersion = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
): EserviceVersion => {
  const eserviceVersion = findEserviceVersion(eservice, eserviceVersionId);

  if (!eserviceVersion) {
    throw eserviceVersionNotFound(eservice.id, eserviceVersionId);
  }

  return eserviceVersion;
};

export const retrieveEserviceLatestVersion = (
  eservice: Eservice,
): EserviceVersion => {
  const latestVersion = findEserviceLatestVersion(eservice);

  if (!latestVersion) {
    throw eserviceVersionNotFound(eservice.id);
  }

  return latestVersion;
};
