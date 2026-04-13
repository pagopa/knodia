import type { ExternalResource } from "@knodia/common-models/externalResource";
import type {
  EserviceId,
  EserviceVersionId,
  OrganizationId,
  PurposeId,
} from "@knodia/common-models/ids";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  agreementNotFound,
  eserviceVersionNotFound,
  purposeNotFound,
} from "../models/errors.ts";

export async function retrieveAgreement(
  consumer: ExternalResource<OrganizationId>,
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) {
  const agreement = await readmodelService.getAgreement(consumer, eserviceId);

  if (!agreement) {
    throw agreementNotFound(consumer, eserviceId);
  }

  return agreement;
}

export async function retrieveEserviceVersion(
  eserviceId: EserviceId,
  eserviceVersionId: EserviceVersionId,
  readmodelService: ReadmodelService,
) {
  const eserviceVersion = await readmodelService.getEserviceVersion(
    eserviceId,
    eserviceVersionId,
  );

  if (!eserviceVersion) {
    throw eserviceVersionNotFound(eserviceId, eserviceVersionId);
  }

  return eserviceVersion;
}

export async function retrievePurpose(
  purposeId: PurposeId,
  readmodelService: ReadmodelService,
) {
  const purpose = await readmodelService.getPurposeById(purposeId);

  if (!purpose) {
    throw purposeNotFound(purposeId);
  }

  return purpose;
}
