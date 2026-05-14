import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";

import { type Eservice, EserviceVersionState } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceNotActive,
  eserviceNotFoundForProducer,
  eserviceSignalHubNotEnabled,
  signalAlreadyExists,
  signalsWithHigherIdExist,
} from "../models/errors.ts";

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
  timeWindowInSeconds: number,
  signalHubDbService: SignalHubDbService,
) {
  const signal = await signalHubDbService.getSignal(signalId, eserviceId);
  if (signal) {
    throw signalAlreadyExists(signalId, eserviceId);
  }

  const recentSignals = await signalHubDbService.getRecentSignalsWithHigherId(
    eserviceId,
    signalId,
    timeWindowInSeconds,
  );
  if (recentSignals.length > 0) {
    throw signalsWithHigherIdExist(signalId, eserviceId, timeWindowInSeconds);
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
