import type { AgreementId, EserviceId } from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementNotFound,
  eserviceNotFound,
  eserviceVersionNotFound,
} from "../models/errors.ts";

export const retrieveEservice = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eservice = await readmodelService.getEservice(eserviceId);

  if (!eservice) {
    throw eserviceNotFound(eserviceId);
  }

  return eservice.data;
};

export const retrieveEserviceLatestVersion = async (
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) => {
  const eserviceLatestVersion =
    await readmodelService.getEserviceLatestVersion(eserviceId);

  if (!eserviceLatestVersion) {
    throw eserviceVersionNotFound(eserviceId);
  }

  return eserviceLatestVersion;
};

export const retrieveAgreement = async (
  agreementId: AgreementId,
  readmodelService: ReadmodelService,
) => {
  const agreement = await readmodelService.getAgreement(agreementId);

  if (!agreement) {
    throw agreementNotFound(agreementId);
  }

  return agreement.data;
};
