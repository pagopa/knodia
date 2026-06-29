// Archived version is a plain integer (PDND-style `version: number`), not semver.
// Future revisions of the document bump this and live under content/v2/...
export const TERMS_VERSION = 1;

export const termsVersionLabel = (version: number = TERMS_VERSION): string =>
  `ver. ${version}`;
