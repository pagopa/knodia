import type { EserviceVersionId } from "@knodia/common-models/ids";

import {
  type Eservice,
  type EserviceVersionState,
} from "@knodia/eservice-models";

export const updateEserviceVersionState = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
  newState: EserviceVersionState,
  now: Date,
): Eservice => ({
  ...eservice,
  updatedAt: now,
  versions: eservice.versions.map((v) =>
    v.id === eserviceVersionId ? { ...v, state: newState, updatedAt: now } : v,
  ),
});
