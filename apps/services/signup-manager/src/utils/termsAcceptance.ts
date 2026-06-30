import { genericInternalError } from "@knodia/common-models/errors";
import {
  formatTermsDate,
  getTermsDocument,
  knodiaVersionLabel,
  toAcceptedText,
} from "@knodia/terms-and-conditions-models";
import { createHash } from "node:crypto";

// SHA-256 over the canonical Italian text (art. 14: only the Italian version is binding), with
// the acceptance date substituted. Both the document text and the "ver. N" label come from the
// accepted `version`, not the current one, so re-hashing a past acceptance reproduces the
// original bytes even after a version bump. node:crypto lives only here.
export function computeTermsAcceptanceDigest(
  acceptedAt: Date,
  version: number,
): string {
  const document = getTermsDocument("it", version);
  const knodiaVersion = knodiaVersionLabel(version);
  if (!document || knodiaVersion === undefined) {
    throw genericInternalError(`No T&C document for version ${version}`);
  }
  const text = toAcceptedText(document, {
    date: formatTermsDate(acceptedAt, "it"),
    knodiaVersion,
  });
  return createHash("sha256").update(text, "utf8").digest("hex");
}
