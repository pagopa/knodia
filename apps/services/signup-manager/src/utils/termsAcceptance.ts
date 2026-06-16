import { createHash } from "node:crypto";

// TODO: replace with the real T&C document version once a versioning scheme exists.
export const TERMS_AND_CONDITIONS_VERSION = "1.0.0";

export function computeTermsAcceptanceDigest(acceptedAt: Date): string {
  const document = buildTermsAcceptanceDocument(acceptedAt);
  return createHash("sha256")
    .update(JSON.stringify(document), "utf8")
    .digest("hex");
}

// TODO: replace the mock body with the real T&C document content (or a reference to it) when available.
function buildTermsAcceptanceDocument(acceptedAt: Date) {
  return { acceptedAt: acceptedAt.toISOString() };
}
