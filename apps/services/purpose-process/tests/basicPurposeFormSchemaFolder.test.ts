import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { describe, expect, it } from "vitest";

import {
  CURRENT_FORM_SCHEMA_VERSION,
  loadFormSchemas,
} from "../src/models/formSchemas.ts";
import { buildFormAnswersValidator } from "../src/utils/formAnswersValidator.ts";

const version = PurposeFormSchemaVersion.enum["1.0"];
const basicSchemas = loadFormSchemas("schemas-basic");
const validateBasic = buildFormAnswersValidator(basicSchemas);

const basicRequired = (
  basicSchemas(CURRENT_FORM_SCHEMA_VERSION).schema as {
    required: string[];
  }
).required;
const basicProperties = Object.keys(
  (
    basicSchemas(CURRENT_FORM_SCHEMA_VERSION).schema as {
      properties: Record<string, unknown>;
    }
  ).properties,
);

describe("Basic purpose form schema folder", () => {
  it("has the reduced top-level required set (no isRequestOnBehalfOfThirdParties)", () => {
    expect(basicRequired).toEqual(["purpose", "usesPersonalData"]);
  });

  it("drops risk-analysis properties from the with-risk-analysis schema", () => {
    expect(basicProperties).not.toContain("dataProtectionMeasures");
    expect(basicProperties).not.toContain("doneDpia");
    expect(basicProperties).not.toContain("isRequestOnBehalfOfThirdParties");
  });

  it("accepts a trimmed basic payload (no third-party request fields)", () => {
    expect(() =>
      validateBasic(
        {
          declarationConfirmGDPR: "true",
          institutionalPurpose: "Institutional purpose",
          legalBasis: ["CONSENT"],
          personalDataTypes: ["WITH_NON_IDENTIFYING_DATA"],
          purpose: "INSTITUTIONAL",
          usesPersonalData: "YES",
        },
        version,
      ),
    ).not.toThrow();
  });

  it("rejects with-risk-analysis-only fields on basic (additionalProperties: false)", () => {
    expect(() =>
      validateBasic(
        {
          declarationConfirmGDPR: "true",
          institutionalPurpose: "Institutional purpose",
          isRequestOnBehalfOfThirdParties: "NO",
          legalBasis: ["CONSENT"],
          personalDataTypes: ["WITH_NON_IDENTIFYING_DATA"],
          purpose: "INSTITUTIONAL",
          usesPersonalData: "YES",
        },
        version,
      ),
    ).toThrow();
  });
});
