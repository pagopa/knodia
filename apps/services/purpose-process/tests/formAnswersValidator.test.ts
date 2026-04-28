/* eslint vitest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectValidationErrors"] }] */

import { ApiError } from "@knodia/fastify-zod-api-commons/models";
import {
  type PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import { MOCK_PURPOSE_FORM_ANSWERS } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { loadFormSchemas } from "../src/models/formSchemas.ts";
import { buildFormAnswersValidator } from "../src/utils/formAnswersValidator.ts";

const assertFormAnswersAreValid = buildFormAnswersValidator(
  loadFormSchemas("schemas-withriskanalysis"),
);
const version = PurposeFormSchemaVersion.enum["1.0"];

function expectValidationErrors(
  formAnswers: unknown,
  expectedDetails: string[],
): void {
  let thrown: unknown;
  try {
    assertFormAnswersAreValid(formAnswers as PurposeFormAnswers, version);
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(ApiError);
  const error = thrown as ApiError<"FORM_ANSWERS_VALIDATION_FAILED">;
  for (const expected of expectedDetails) {
    expect(error.errors).toContainEqual(
      expect.objectContaining({
        code: "FORM_ANSWERS_VALIDATION_FAILED",
        detail: expect.stringContaining(expected),
      }),
    );
  }
}

// eslint-disable-next-line max-lines-per-function
describe("assertFormAnswersAreValid", () => {
  it("should not throw for valid form answers", () => {
    expect(() =>
      assertFormAnswersAreValid(MOCK_PURPOSE_FORM_ANSWERS, version),
    ).not.toThrow();
  });

  it("should throw for empty form answers (missing required fields)", () => {
    expectValidationErrors({}, [
      "must have required property 'purpose'",
      "must have required property 'usesPersonalData'",
      "must have required property 'isRequestOnBehalfOfThirdParties'",
    ]);
  });

  it("should throw for invalid enum value", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        purpose: "INVALID_VALUE",
      },
      ["/purpose must be equal to one of the allowed values"],
    );
  });

  it("should throw when conditional required fields for PUBLIC_INTEREST are missing", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        // legalBasis=PUBLIC_INTEREST requires legalBasisPublicInterest
        legalBasis: ["PUBLIC_INTEREST"],
      },
      ["must have required property 'legalBasisPublicInterest'"],
    );
  });

  it("should throw when purpose=OTHER but otherPurpose is missing", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        institutionalPurpose: undefined,
        otherPurpose: undefined,
        purpose: "OTHER",
      },
      ["must have required property 'otherPurpose'"],
    );
  });

  it("should throw when usesPersonalData=YES but declarationConfirmGDPR is missing", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        declarationConfirmGDPR: undefined,
      },
      ["must have required property 'declarationConfirmGDPR'"],
    );
  });

  it("should throw when isRequestOnBehalfOfThirdParties=YES but thirdPartiesRequestDataUsage is missing", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        isRequestOnBehalfOfThirdParties: "YES",
      },
      ["must have required property 'thirdPartiesRequestDataUsage'"],
    );
  });

  it("should throw when legalBasisPublicInterest=PUBLIC_INTEREST_TASK but publicInterestTaskText is missing", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        legalBasis: ["PUBLIC_INTEREST"],
        legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
      },
      ["must have required property 'publicInterestTaskText'"],
    );
  });

  it("should not throw when legalBasisPublicInterest=PUBLIC_INTEREST_TASK and publicInterestTaskText is provided", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          legalBasis: ["PUBLIC_INTEREST"],
          legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
          publicInterestTaskText: "Reference to public interest task",
        },
        version,
      ),
    ).not.toThrow();
  });

  it("should not throw when usesPersonalData=NO and the non-personal-data branch is satisfied", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          institutionalPurpose: "Institutional purpose",
          isRequestOnBehalfOfThirdParties: "NO",
          purpose: "INSTITUTIONAL",
          usesPersonalData: "NO",
          usesThirdPartyNonPersonalData: "NO",
        },
        version,
      ),
    ).not.toThrow();
  });

  it("should throw when usesPersonalData=NO and usesThirdPartyNonPersonalData is missing", () => {
    expectValidationErrors(
      {
        institutionalPurpose: "Institutional purpose",
        isRequestOnBehalfOfThirdParties: "NO",
        purpose: "INSTITUTIONAL",
        usesPersonalData: "NO",
      },
      ["must have required property 'usesThirdPartyNonPersonalData'"],
    );
  });

  it("should throw when usesPersonalData=NO, usesThirdPartyNonPersonalData=YES but usesThirdPartyConfidentialData is missing", () => {
    expectValidationErrors(
      {
        institutionalPurpose: "Institutional purpose",
        isRequestOnBehalfOfThirdParties: "NO",
        purpose: "INSTITUTIONAL",
        usesPersonalData: "NO",
        usesThirdPartyNonPersonalData: "YES",
      },
      ["must have required property 'usesThirdPartyConfidentialData'"],
    );
  });

  describe("non-empty constraints", () => {
    it("should throw when a required free-text field is an empty string", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          institutionalPurpose: "",
        },
        ["/institutionalPurpose must NOT have fewer than 1 characters"],
      );
    });

    it("should throw when a required array field is empty", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          legalBasis: [],
          personalDataTypes: [],
        },
        [
          "/legalBasis must NOT have fewer than 1 items",
          "/personalDataTypes must NOT have fewer than 1 items",
        ],
      );
    });
  });

  describe("else branches (forbidden fields)", () => {
    const nonPersonalDataBranch = {
      institutionalPurpose: "Institutional purpose",
      isRequestOnBehalfOfThirdParties: "NO",
      purpose: "INSTITUTIONAL",
      usesPersonalData: "NO",
      usesThirdPartyNonPersonalData: "NO",
    };

    it("should throw when usesPersonalData=YES but usesThirdPartyNonPersonalData is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          usesThirdPartyNonPersonalData: "NO",
        },
        ["/usesThirdPartyNonPersonalData boolean schema is false"],
      );
    });

    it("should throw when usesPersonalData=NO but personalDataTypes is present", () => {
      expectValidationErrors(
        {
          ...nonPersonalDataBranch,
          personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        },
        ["/personalDataTypes boolean schema is false"],
      );
    });

    it("should throw when purpose=INSTITUTIONAL but otherPurpose is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          otherPurpose: "Some other purpose",
        },
        ["/otherPurpose boolean schema is false"],
      );
    });

    it("should throw when purpose=OTHER but institutionalPurpose is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          // institutionalPurpose is still present from the mock (stale)
          otherPurpose: "Other purpose",
          purpose: "OTHER",
        },
        ["/institutionalPurpose boolean schema is false"],
      );
    });

    it("should throw when policyProvided=YES but reasonPolicyNotProvided is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          reasonPolicyNotProvided: "Some reason",
        },
        ["/reasonPolicyNotProvided boolean schema is false"],
      );
    });

    it("should throw when purposePursuit=MERE_CORRECTNESS but checkedAllDataNeeded is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          checkedAllDataNeeded: "true",
        },
        ["/checkedAllDataNeeded boolean schema is false"],
      );
    });

    it("should throw when legalBasis does not contain PUBLIC_INTEREST but legalBasisPublicInterest is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          legalBasisPublicInterest: "RULE_OF_LAW",
        },
        ["/legalBasisPublicInterest boolean schema is false"],
      );
    });

    it("should throw when isRequestOnBehalfOfThirdParties=NO but thirdPartiesRequestDataUsage is present", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          thirdPartiesRequestDataUsage: "PA_ONLY",
        },
        ["/thirdPartiesRequestDataUsage boolean schema is false"],
      );
    });

    it("should throw when usesPersonalData=NO but ruleOfLawText is present (transitive)", () => {
      expectValidationErrors(
        {
          ...nonPersonalDataBranch,
          ruleOfLawText: "Some law reference",
        },
        ["/ruleOfLawText boolean schema is false"],
      );
    });
  });

  describe("hideOptions mirroring (forbidden option values)", () => {
    it("should throw when personalDataTypes contains GDPR_ART_9 and legalBasisPublicInterest is PUBLIC_INTEREST_TASK", () => {
      expectValidationErrors(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          legalBasis: ["PUBLIC_INTEREST"],
          legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
          personalDataTypes: ["GDPR_ART_9"],
          publicInterestTaskText: "Some reference",
        },
        ["/legalBasisPublicInterest must NOT be valid"],
      );
    });

    it("should not throw when personalDataTypes contains GDPR_ART_9 and legalBasisPublicInterest is RULE_OF_LAW", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            legalBasis: ["PUBLIC_INTEREST"],
            legalBasisPublicInterest: "RULE_OF_LAW",
            personalDataTypes: ["GDPR_ART_9"],
            ruleOfLawText: "Applicable regulation",
          },
          version,
        ),
      ).not.toThrow();
    });

    it("should not throw when personalDataTypes does not contain GDPR_ART_9 and legalBasisPublicInterest is PUBLIC_INTEREST_TASK", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            legalBasis: ["PUBLIC_INTEREST"],
            legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
            publicInterestTaskText: "Some reference",
          },
          version,
        ),
      ).not.toThrow();
    });
  });

  it("should throw for unknown properties (e.g. misspelled field names)", () => {
    expectValidationErrors(
      {
        ...MOCK_PURPOSE_FORM_ANSWERS,
        legalBasicPublicInterest: "RULE_OF_LAW",
      },
      ["must NOT have additional properties"],
    );
  });
});
