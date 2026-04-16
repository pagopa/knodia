import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { MOCK_PURPOSE_FORM_ANSWERS } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { assertFormAnswersAreValid } from "../src/utils/formAnswersValidator.ts";

const version = PurposeFormSchemaVersion.enum["1.0"];

// eslint-disable-next-line max-lines-per-function
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

  it("should throw when conditional required fields for PUBLIC_INTEREST are missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          // legalBasis=PUBLIC_INTEREST requires legalBasisPublicInterest
          legalBasis: ["PUBLIC_INTEREST"],
        },
        version,
      ),
    ).toThrow();
  });

  it("should throw when purpose=OTHER but otherPurpose is missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          institutionalPurpose: undefined,
          otherPurpose: undefined,
          purpose: "OTHER",
        },
        version,
      ),
    ).toThrow();
  });

  it("should throw when usesPersonalData=YES but declarationConfirmGDPR is missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          declarationConfirmGDPR: undefined,
        },
        version,
      ),
    ).toThrow();
  });

  it("should throw when isRequestOnBehalfOfThirdParties=YES but thirdPartiesRequestDataUsage is missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          isRequestOnBehalfOfThirdParties: "YES",
        },
        version,
      ),
    ).toThrow();
  });

  it("should throw when legalBasisPublicInterest=PUBLIC_INTEREST_TASK but publicInterestTaskText is missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          ...MOCK_PURPOSE_FORM_ANSWERS,
          legalBasis: ["PUBLIC_INTEREST"],
          legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
        },
        version,
      ),
    ).toThrow();
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
    expect(() =>
      assertFormAnswersAreValid(
        {
          institutionalPurpose: "Institutional purpose",
          isRequestOnBehalfOfThirdParties: "NO",
          purpose: "INSTITUTIONAL",
          usesPersonalData: "NO",
        },
        version,
      ),
    ).toThrow();
  });

  it("should throw when usesPersonalData=NO, usesThirdPartyNonPersonalData=YES but usesThirdPartyConfidentialData is missing", () => {
    expect(() =>
      assertFormAnswersAreValid(
        {
          institutionalPurpose: "Institutional purpose",
          isRequestOnBehalfOfThirdParties: "NO",
          purpose: "INSTITUTIONAL",
          usesPersonalData: "NO",
          usesThirdPartyNonPersonalData: "YES",
        },
        version,
      ),
    ).toThrow();
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
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            usesThirdPartyNonPersonalData: "NO",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when usesPersonalData=NO but personalDataTypes is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...nonPersonalDataBranch,
            personalDataTypes: ["WITH_IDENTIFYING_DATA"],
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when purpose=INSTITUTIONAL but otherPurpose is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            otherPurpose: "Some other purpose",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when purpose=OTHER but institutionalPurpose is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            // institutionalPurpose is still present from the mock (stale)
            otherPurpose: "Other purpose",
            purpose: "OTHER",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when policyProvided=YES but reasonPolicyNotProvided is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            reasonPolicyNotProvided: "Some reason",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when purposePursuit=MERE_CORRECTNESS but checkedAllDataNeeded is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            checkedAllDataNeeded: "true",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when legalBasis does not contain PUBLIC_INTEREST but legalBasisPublicInterest is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            legalBasisPublicInterest: "RULE_OF_LAW",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when isRequestOnBehalfOfThirdParties=NO but thirdPartiesRequestDataUsage is present", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            thirdPartiesRequestDataUsage: "PA_ONLY",
          },
          version,
        ),
      ).toThrow();
    });

    it("should throw when usesPersonalData=NO but ruleOfLawText is present (transitive)", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...nonPersonalDataBranch,
            ruleOfLawText: "Some law reference",
          },
          version,
        ),
      ).toThrow();
    });
  });

  describe("hideOptions mirroring (forbidden option values)", () => {
    it("should throw when personalDataTypes contains GDPR_ART_9 and legalBasisPublicInterest is PUBLIC_INTEREST_TASK", () => {
      expect(() =>
        assertFormAnswersAreValid(
          {
            ...MOCK_PURPOSE_FORM_ANSWERS,
            legalBasis: ["PUBLIC_INTEREST"],
            legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
            personalDataTypes: ["GDPR_ART_9"],
            publicInterestTaskText: "Some reference",
          },
          version,
        ),
      ).toThrow();
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
});
