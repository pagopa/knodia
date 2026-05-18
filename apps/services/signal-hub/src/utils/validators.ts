import type { ExternalResource } from "@knodia/common-models/externalResource";
import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";

import { type Eservice, EserviceVersionState } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  consumerNotAuthorizedToPullSignals,
  eserviceNotActive,
  eserviceNotFoundForProducer,
  eserviceSignalHubNotEnabled,
  newerSignalsExist,
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

export async function assertEserviceIsActiveWithSignalHubEnabled(
  eserviceId: EserviceId,
  producerId: OrganizationId,
  readmodelService: ReadmodelService,
) {
  const eservice = await readmodelService.getEserviceByIdAndProducerId(
    eserviceId,
    producerId,
  );

  assertEserviceBelongsToProducer(eservice?.data, eserviceId, producerId);
  assertEserviceIsActive(eservice.data);
  assertEserviceHasSignalHubEnabled(eservice.data);
}

export async function assertSignalCanBePushed(
  signalId: number,
  eserviceId: EserviceId,
  signalHubDbService: SignalHubDbService,
) {
  const { signals } = await signalHubDbService.getSignals(
    signalId,
    eserviceId,
    1,
  );
  if (signals.length > 0) {
    throw signalAlreadyExists(signalId, eserviceId);
  }

  const newerSignals = await signalHubDbService.getNewerSignals(
    signalId,
    eserviceId,
  );
  if (newerSignals.length > 0) {
    throw newerSignalsExist(signalId, eserviceId);
  }
}

function assertEserviceBelongsToProducer(
  eservice: Eservice | undefined,
  eserviceId: EserviceId,
  producerId: OrganizationId,
): asserts eservice is Eservice {
  if (!eservice) {
    throw eserviceNotFoundForProducer(eserviceId, producerId);
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
