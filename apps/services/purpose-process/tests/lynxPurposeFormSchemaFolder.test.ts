import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { describe, expect, it } from "vitest";

import {
  CURRENT_FORM_SCHEMA_VERSION,
  loadFormSchemas,
} from "../src/models/formSchemas.ts";
import { buildFormAnswersValidator } from "../src/utils/formAnswersValidator.ts";

const version = PurposeFormSchemaVersion.enum["1.0"];
const lynxSchemas = loadFormSchemas("schemas-lynx");
const validateLynx = buildFormAnswersValidator(lynxSchemas);

const lynxRequired = (
  lynxSchemas(CURRENT_FORM_SCHEMA_VERSION).schema as {
    required: string[];
  }
).required;
const lynxProperties = Object.keys(
  (
    lynxSchemas(CURRENT_FORM_SCHEMA_VERSION).schema as {
      properties: Record<string, unknown>;
    }
  ).properties,
);

describe("Lynx purpose form schema folder", () => {
  it("has the reduced top-level required set (no isRequestOnBehalfOfThirdParties)", () => {
    expect(lynxRequired).toEqual(["purpose", "usesPersonalData"]);
  });

  it("drops risk-analysis properties from the Orion schema", () => {
    expect(lynxProperties).not.toContain("dataProtectionMeasures");
    expect(lynxProperties).not.toContain("doneDpia");
    expect(lynxProperties).not.toContain("isRequestOnBehalfOfThirdParties");
  });

  it("accepts a trimmed Lynx payload (no third-party request fields)", () => {
    expect(() =>
      validateLynx(
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

  it("rejects Orion-only fields on Lynx (additionalProperties: false)", () => {
    expect(() =>
      validateLynx(
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
