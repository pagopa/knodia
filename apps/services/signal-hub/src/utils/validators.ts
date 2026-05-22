import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";

import { type Eservice, EserviceVersionState } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerNotAuthorizedToPullSignals,
  eserviceNotActive,
  eserviceSignalHubNotEnabled,
  nonConsecutiveSignalId,
  producerNotAuthorizedToPushSignals,
  signalAlreadyExists,
} from "../models/errors.ts";

export function assertEserviceIsActiveWithSignalHubEnabled(eservice: Eservice) {
  assertEserviceIsActive(eservice);
  assertEserviceHasSignalHubEnabled(eservice);
}

export async function assertOrganizationAuthorizedToPullSignals(
  organization: ExternalResource<OrganizationId>,
  eserviceId: EserviceId,
  readmodelService: ReadmodelService,
) {
  const isAuthorized =
    await readmodelService.checkAgreementAndPurposeExistAndAreActive(
      organization,
      eserviceId,
    );

  if (!isAuthorized) {
    throw consumerNotAuthorizedToPullSignals(eserviceId, organization);
  }
}

export function assertOrganizationAuthorizedToPushSignals(
  eservice: Eservice,
  organizationId: OrganizationId,
) {
  if (eservice.producerId !== organizationId) {
    throw producerNotAuthorizedToPushSignals(eservice.id, organizationId);
  }
}

export async function assertSignalCanBePushed(
  signalId: number,
  eserviceId: EserviceId,
  signalHubDbService: SignalHubDbService,
) {
  const maxSignalId = await signalHubDbService.getMaxSignalId(eserviceId);
  if (signalId <= maxSignalId) {
    throw signalAlreadyExists(signalId, eserviceId);
  }
  if (signalId !== maxSignalId + 1) {
    throw nonConsecutiveSignalId(signalId, maxSignalId, eserviceId);
  }
}

function assertEserviceHasSignalHubEnabled(eservice: Eservice) {
  if (!eservice.isSignalHubEnabled) {
    throw eserviceSignalHubNotEnabled(eservice.id);
  }
}

function assertEserviceIsActive(eservice: Eservice) {
  const isActive = eservice.versions.some(
    (version) => version.state === EserviceVersionState.enum.Active,
  );

  if (!isActive) {
    throw eserviceNotActive(eservice.id);
  }
}
