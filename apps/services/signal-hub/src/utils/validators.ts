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

export async function assertConsumerAuthorizedToPullSignals(
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

export function assertEserviceIsActiveWithSignalHubEnabled(eservice: Eservice) {
  assertEserviceIsActive(eservice);
  assertEserviceHasSignalHubEnabled(eservice);
}

export function assertProducerAuthorizedToPushSignals(
  eservice: Eservice,
  producerId: OrganizationId,
) {
  if (eservice.producerId !== producerId) {
    throw producerNotAuthorizedToPushSignals(eservice.id, producerId);
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
