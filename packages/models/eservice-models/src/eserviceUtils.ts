import type { Eservice, EserviceVersion } from "./eservice.ts";

export const getLatestVersion = (eservice: Eservice): EserviceVersion => {
  const latestVersion = eservice.versions.toSorted(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
  if (!latestVersion) {
    throw new Error(`Eservice ${eservice.id} has no versions`);
  }
  return latestVersion;
};
