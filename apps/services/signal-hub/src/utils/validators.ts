import type { EserviceId, OrganizationId } from "@knodia/common-models/ids";
import type { SignalHubDbService } from "@knodia/db-signal-hub/services";

import { type Eservice, EserviceVersionState } from "@knodia/eservice-models";

import type { ReadmodelService } from "../services/readmodelService.ts";

import {
  eserviceNotActive,
  eserviceNotFound,
  eserviceSignalHubNotEnabled,
  signalAlreadyExists,
  signalsWithHigherIdExist,
} from "../models/errors.ts";
import { retrieveEserviceByIdAndProducerId } from "./readmodelUtils.ts";

export async function assertEserviceIsActiveWithSignalHubEnabled(
  eserviceId: EserviceId,
  producerId: OrganizationId,
  readmodelService: ReadmodelService,
) {
  const eservice = await retrieveEserviceByIdAndProducerId(
    eserviceId,
    producerId,
    readmodelService,
  );

  if (!eservice) {
    throw eserviceNotFound(eserviceId, producerId);
  }

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
