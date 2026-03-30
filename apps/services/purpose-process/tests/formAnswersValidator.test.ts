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
          // Missing purposeDescription which is top-level required
          legalBasis: ["PUBLIC_INTEREST"],
          // Missing publicInterestReasons and legalBasisPublicInterest
          personalDataTypes: ["WITH_IDENTIFYING_DATA"],
          purpose: "INSTITUTIONAL",
          usesThirdPartyPersonalData: "NO",
        },
        version,
      ),
    ).toThrow();
  });

  it("should not throw when all required fields are provided", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          legalBasis: ["CONSENT"],
          personalDataTypes: ["WITH_IDENTIFYING_DATA"],
          purpose: "INSTITUTIONAL",
          purposeDescription: "Testing purpose",
          usesThirdPartyPersonalData: "NO",
        },
        version,
      ),
    ).not.toThrow();
  });
});
