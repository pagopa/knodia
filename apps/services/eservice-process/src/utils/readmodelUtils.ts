import type { EserviceId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceNotFound,
  eserviceVersionNotFound,
  interfaceNotFound,
} from "../models/errors.ts";

export const retrieveEservice = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eservice = await readmodelService.getEservice(eserviceId);

  if (!eservice) {
    throw eserviceNotFound(eserviceId);
  }

  return eservice;
};

export const retrieveEserviceLatestVersion = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eserviceVersion =
    await readmodelService.getEserviceLatestVersion(eserviceId);

  if (!eserviceVersion) {
    throw eserviceVersionNotFound(eserviceId);
  }

  return eserviceVersion;
};

export const retrieveEserviceLatestVersionInterface = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eserviceVersionInterface =
    await readmodelService.getEserviceLatestVersionInterface(eserviceId);

  if (!eserviceVersionInterface) {
    throw interfaceNotFound(eserviceId);
  }

  return eserviceVersionInterface;
};
