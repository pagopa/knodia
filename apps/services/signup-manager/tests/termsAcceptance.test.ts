import {
  formatTermsDate,
  getTermsDocument,
  knodiaVersionLabel,
  TERMS_DOCUMENT_VERSION,
  toAcceptedText,
} from "@knodia/terms-and-conditions-models";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { computeTermsAcceptanceDigest } from "../src/utils/termsAcceptance.ts";

describe("computeTermsAcceptanceDigest", () => {
  const date = new Date("2026-06-25T10:00:00.000Z");
  const version = TERMS_DOCUMENT_VERSION;

  it("archives the document version as the integer 1", () => {
    expect(TERMS_DOCUMENT_VERSION).toBe(1);
  });

  it("returns a 64-char hex sha256", () => {
    expect(computeTermsAcceptanceDigest(date, version)).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it("is reproducible: same date and version yield the same digest", () => {
    expect(computeTermsAcceptanceDigest(date, version)).toBe(
      computeTermsAcceptanceDigest(date, version),
    );
  });

  it("changes when the acceptance date changes", () => {
    const other = new Date("2026-07-01T10:00:00.000Z");
    expect(computeTermsAcceptanceDigest(date, version)).not.toBe(
      computeTermsAcceptanceDigest(other, version),
    );
  });

  it("throws for a version with no frozen document", () => {
    expect(() => computeTermsAcceptanceDigest(date, 999)).toThrow(
      "No T&C document for version 999",
    );
  });

  it("hashes the canonical Italian text of the accepted version", () => {
    const document = getTermsDocument("it", version);
    const knodiaVersion = knodiaVersionLabel(version);
    if (!document || knodiaVersion === undefined) {
      throw new Error(`Missing T&C document v${version}`);
    }
    const expected = createHash("sha256")
      .update(
        toAcceptedText(document, {
          date: formatTermsDate(date, "it"),
          knodiaVersion,
        }),
        "utf8",
      )
      .digest("hex");
    expect(computeTermsAcceptanceDigest(date, version)).toBe(expected);
  });
});
