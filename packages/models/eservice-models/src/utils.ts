import type { EserviceVersionId } from "@knodia/common-models/ids";

import type { Eservice, EserviceVersion } from "./eservice.ts";

export const findEserviceLatestVersion = (
  eservice: Eservice,
): EserviceVersion | undefined =>
  eservice.versions.toSorted((a, b) => b.versionNumber - a.versionNumber).at(0);

export const findEserviceVersion = (
  eservice: Eservice,
  eserviceVersionId: EserviceVersionId,
): EserviceVersion | undefined =>
  eservice.versions.find((version) => version.id === eserviceVersionId);
