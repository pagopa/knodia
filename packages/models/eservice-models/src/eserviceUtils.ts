import { match } from "ts-pattern";

import type { API_EserviceStatus } from "./api.ts";
import type { Eservice, EserviceVersion } from "./eservice.ts";

const getLatestVersion = (eservice: Eservice): EserviceVersion => {
  const latestVersion = eservice.versions.toSorted(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
  if (!latestVersion) {
    throw new Error(`Eservice ${eservice.id} has no versions`);
  }
  return latestVersion;
};

export const deriveEserviceStatus = (
  eservice: Eservice,
): API_EserviceStatus => {
  const latestVersion = getLatestVersion(eservice);
  return match(latestVersion.state)
    .with("Active", () => "Available" as const)
    .with("Suspended", () => "Unavailable" as const)
    .with("Archived", () => "Archived" as const)
    .exhaustive();
};
