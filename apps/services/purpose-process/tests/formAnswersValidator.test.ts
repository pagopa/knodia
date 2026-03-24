import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { MOCK_PURPOSE_FORM_ANSWERS } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { assertFormAnswersAreValid } from "../src/utils/formAnswersValidator.ts";

const version = PurposeFormSchemaVersion.enum["1.0"];

describe("assertFormAnswersAreValid", () => {
  it("should not throw for valid form answers", () => {
    expect(() =>
      assertFormAnswersAreValid(MOCK_PURPOSE_FORM_ANSWERS, version),
    ).not.toThrow();
  });

  it("should throw for empty form answers (missing required fields)", () => {
    expect(() => assertFormAnswersAreValid({}, version)).toThrow();
  });

  it("should throw for invalid enum value", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          purpose: "INVALID_VALUE",
        },
        version,
      ),
    ).toThrow();
  });

  it("should throw when conditional required fields are missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          isRequestOnBehalfOfThirdParties: "NO",
          purpose: "INSTITUTIONAL",
          // institutionalPurpose is conditionally required but missing
          usesPersonalData: "YES",
          // personalDataTypes and legalBasis are conditionally required but missing
        },
        version,
      ),
    ).toThrow();
  });

  it("should not throw when conditional required fields are provided", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          checkedAllDataNeeded: "true",
          checkedExistenceMereCorrectnessInteropCatalogue: "true",
          confirmPrincipleIntegrityAndDiscretion: "true",
          dataDownload: "NO",
          declarationConfirmGDPR: "true",
          deliveryMethod: "CLEARTEXT",
          doneDpia: "NO",
          institutionalPurpose: "Testing purpose",
          isRequestOnBehalfOfThirdParties: "NO",
          knowsDataQuantity: "NO",
          legalBasis: ["CONSENT"],
          personalDataTypes: ["WITH_IDENTIFYING_DATA"],
          policyProvided: "YES",
          policyProvidedMedium: "ONLINE",
          policyProvidedOnlineLink: "https://example.com/policy",
          purpose: "INSTITUTIONAL",
          purposePursuit: "MERE_CORRECTNESS",
          usesPersonalData: "YES",
        },
        version,
      ),
    ).not.toThrow();
  });
});
