import type { API_EserviceAvailability } from "./api.ts";
import type { Eservice, EserviceVersion } from "./eservice.ts";

const getLatestVersion = (eservice: Eservice): EserviceVersion | undefined =>
  eservice.versions.toSorted((a, b) => b.versionNumber - a.versionNumber)[0];

export const deriveEserviceAvailability = (
  eservice: Eservice,
): API_EserviceAvailability => {
  const latestVersion = getLatestVersion(eservice);
  return latestVersion?.state === "Active" ? "Available" : "Unavailable";
};
