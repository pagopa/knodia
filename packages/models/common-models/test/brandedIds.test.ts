import { describe, expect, it } from "vitest";

import { type AgreementId, unsafeBrandId } from "../src/ids/brandedIds.ts";

const RFC_4122_UUID = "550e8400-e29b-41d4-a716-446655440000";
const COGNITO_SUB = "9324e892-6081-703b-4b2f-1f007ecd0b0c";

describe("unsafeBrandId", () => {
  it("should accept a standard UUID for uuid-based IDs", () => {
    expect(() => unsafeBrandId<AgreementId>(RFC_4122_UUID)).not.toThrow();
  });

  it("should reject a non-RFC-4122 GUID for uuid-based IDs", () => {
    expect(() => unsafeBrandId<AgreementId>(COGNITO_SUB)).toThrow();
  });

  it("should reject an invalid string", () => {
    expect(() => unsafeBrandId<AgreementId>("not-valid")).toThrow();
  });
});
