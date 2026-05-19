// Duplicated PDND-style from the keys of
// `apps/services/mock-eservice/src/data/rotatingAddresses.json`.
// Any change MUST be mirrored on both sides — the consumer matches
// `signal.object_id = sha256(fiscalCode + seed)` against this list and the
// mock e-service rotates `/residence` for the same set.

export const rotatingFiscalCodes = [
  "RMNLNR03H12H501Z",
  "CNTLCC89E26L378K",
  "RSSGRG65D48G702L",
] as const;
