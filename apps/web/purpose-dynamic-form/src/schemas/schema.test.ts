import Ajv from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

import dataSharingSchema from "./data-sharing/schema.json";
import pa31Schema from "./pa31/schema.json";
import twoFormSchema from "./two-form/schema.json";

const ajv = new Ajv();

describe("data schemas compile as valid JSON Schema 2020-12", () => {
  it.each([
    ["two-form", twoFormSchema],
    ["pa31", pa31Schema],
    ["data-sharing", dataSharingSchema],
  ])("%s", (_name, schema) => {
    expect(() => ajv.compile(schema)).not.toThrow();
  });
});

describe("common data schema (two-form representative)", () => {
  const validate = ajv.compile(twoFormSchema);

  const validBase = {
    legalBasis: ["CONSENT"],
    personalDataTypes: ["WITH_IDENTIFYING_DATA"],
    purpose: "INSTITUTIONAL",
    purposeDescription: "Test purpose",
    usesThirdPartyPersonalData: "NO",
  };

  it("accepts minimal valid data", () => {
    expect(validate(validBase)).toBe(true);
  });

  describe("rejects missing required fields", () => {
    it.each([
      "purpose",
      "purposeDescription",
      "personalDataTypes",
      "legalBasis",
      "usesThirdPartyPersonalData",
    ] as const)("missing %s", (field) => {
      const data = Object.fromEntries(
        Object.entries(validBase).filter(([k]) => k !== field),
      );
      expect(validate(data)).toBe(false);
    });
  });

  it("rejects invalid enum value", () => {
    expect(validate({ ...validBase, purpose: "INVALID" })).toBe(false);
  });

  it("rejects wrong type for array field", () => {
    expect(validate({ ...validBase, personalDataTypes: "not-array" })).toBe(
      false,
    );
  });

  it("rejects duplicate items in uniqueItems array", () => {
    expect(
      validate({
        ...validBase,
        personalDataTypes: ["WITH_IDENTIFYING_DATA", "WITH_IDENTIFYING_DATA"],
      }),
    ).toBe(false);
  });

  it("rejects string exceeding maxLength", () => {
    expect(
      validate({ ...validBase, purposeDescription: "x".repeat(2001) }),
    ).toBe(false);
  });

  it("accepts string at maxLength boundary", () => {
    expect(
      validate({ ...validBase, purposeDescription: "x".repeat(2000) }),
    ).toBe(true);
  });
});

describe("common data schema — conditional requirements", () => {
  const validate = ajv.compile(twoFormSchema);

  const validBase = {
    legalBasis: ["CONSENT"],
    personalDataTypes: ["WITH_IDENTIFYING_DATA"],
    purpose: "INSTITUTIONAL",
    purposeDescription: "Test purpose",
    usesThirdPartyPersonalData: "NO",
  };

  it("personalDataTypes contains OTHER → requires otherPersonalDataTypes", () => {
    const data = {
      ...validBase,
      personalDataTypes: ["OTHER"],
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, otherPersonalDataTypes: "desc" })).toBe(true);
  });

  it("legalBasis contains LEGAL_OBLIGATION → requires legalObligationReference", () => {
    const data = { ...validBase, legalBasis: ["LEGAL_OBLIGATION"] };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, legalObligationReference: "ref" })).toBe(true);
  });

  it("legalBasis contains PUBLIC_INTEREST → requires publicInterestReasons and legalBasisPublicInterest", () => {
    const data = { ...validBase, legalBasis: ["PUBLIC_INTEREST"] };
    expect(validate(data)).toBe(false);
    expect(
      validate({
        ...data,
        legalBasisPublicInterest: "RULE_OF_LAW",
        publicInterestReasons: ["RULE_OF_LAW"],
      }),
    ).toBe(false); // still needs ruleOfLawText due to nested conditional
    expect(
      validate({
        ...data,
        legalBasisPublicInterest: "RULE_OF_LAW",
        publicInterestReasons: ["RULE_OF_LAW"],
        ruleOfLawText: "text",
      }),
    ).toBe(true);
  });

  it("legalBasisPublicInterest ADMINISTRATIVE_ACT → requires administrativeActText", () => {
    const data = {
      ...validBase,
      legalBasis: ["PUBLIC_INTEREST"],
      legalBasisPublicInterest: "ADMINISTRATIVE_ACT",
      publicInterestReasons: ["ADMINISTRATIVE_ACT"],
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, administrativeActText: "text" })).toBe(true);
  });

  it("legalBasisPublicInterest PUBLIC_INTEREST_TASK → requires publicInterestTaskText", () => {
    const data = {
      ...validBase,
      legalBasis: ["PUBLIC_INTEREST"],
      legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
      publicInterestReasons: ["PUBLIC_INTEREST_TASK"],
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, publicInterestTaskText: "text" })).toBe(true);
  });

  it("knowsDataQuantity YES → requires dataQuantity", () => {
    const data = { ...validBase, knowsDataQuantity: "YES" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, dataQuantity: "QUANTITY_0_TO_100" })).toBe(true);
  });

  it("knowsDataQuantity NO → does not require dataQuantity", () => {
    expect(validate({ ...validBase, knowsDataQuantity: "NO" })).toBe(true);
  });

  it("policyProvided NO → requires reasonPolicyNotProvided", () => {
    const data = { ...validBase, policyProvided: "NO" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, reasonPolicyNotProvided: "reason" })).toBe(true);
  });

  it("policyProvided YES → requires policyProvidedMedium", () => {
    const data = { ...validBase, policyProvided: "YES" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, policyProvidedMedium: "PRINT" })).toBe(true);
  });

  it("policyProvided YES + policyProvidedMedium ONLINE → requires policyProvidedOnlineLink", () => {
    const data = {
      ...validBase,
      policyProvided: "YES",
      policyProvidedMedium: "ONLINE",
    };
    expect(validate(data)).toBe(false);
    expect(
      validate({ ...data, policyProvidedOnlineLink: "https://example.com" }),
    ).toBe(true);
  });

  it("GDPR_ART_10 + confirmPrincipleIntegrityAndDiscretion true → requires dataProtectionMeasures", () => {
    const data = {
      ...validBase,
      confirmPrincipleIntegrityAndDiscretion: "true",
      personalDataTypes: ["GDPR_ART_10"],
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, dataProtectionMeasures: "measures" })).toBe(
      true,
    );
  });

  it("GDPR_ART_10 + confirmPrincipleIntegrityAndDiscretion false → does not require dataProtectionMeasures", () => {
    expect(
      validate({
        ...validBase,
        confirmPrincipleIntegrityAndDiscretion: "false",
        personalDataTypes: ["GDPR_ART_10"],
      }),
    ).toBe(true);
  });

  it("doneDpia YES → requires confirmedDoneDpia", () => {
    const data = { ...validBase, doneDpia: "YES" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, confirmedDoneDpia: "YES" })).toBe(true);
  });

  it("dataDownload YES → requires dataRetentionPeriod", () => {
    const data = { ...validBase, dataDownload: "YES" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, dataRetentionPeriod: "30 days" })).toBe(true);
  });

  it("purposePursuit MERE_CORRECTNESS → requires checkedExistenceMereCorrectnessInteropCatalogue", () => {
    const data = { ...validBase, purposePursuit: "MERE_CORRECTNESS" };
    expect(validate(data)).toBe(false);
    expect(
      validate({
        ...data,
        checkedExistenceMereCorrectnessInteropCatalogue: "true",
      }),
    ).toBe(true);
  });

  it("purposePursuit NEW_PERSONAL_DATA → requires checkedAllDataNeeded", () => {
    const data = { ...validBase, purposePursuit: "NEW_PERSONAL_DATA" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, checkedAllDataNeeded: "true" })).toBe(true);
  });

  it("usesThirdPartyPersonalData YES → requires thirdPartiesRequestDataUsage", () => {
    const data = { ...validBase, usesThirdPartyPersonalData: "YES" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, thirdPartiesRequestDataUsage: "PA_ONLY" })).toBe(
      true,
    );
  });
});

describe("pa31 data schema", () => {
  const validate = ajv.compile(pa31Schema);

  const validBase = {
    institutionalPurpose: "desc",
    isRequestOnBehalfOfThirdParties: "NO",
    purpose: "INSTITUTIONAL",
    usesPersonalData: "NO",
    usesThirdPartyPersonalData: "NO",
  };

  it("accepts minimal valid data (no personal data path)", () => {
    expect(validate(validBase)).toBe(true);
  });

  describe("rejects missing required fields", () => {
    it.each([
      "purpose",
      "usesPersonalData",
      "isRequestOnBehalfOfThirdParties",
    ] as const)("missing %s", (field) => {
      const data = Object.fromEntries(
        Object.entries(validBase).filter(([k]) => k !== field),
      );
      expect(validate(data)).toBe(false);
    });
  });

  it("purpose INSTITUTIONAL → requires institutionalPurpose", () => {
    const data = Object.fromEntries(
      Object.entries(validBase).filter(([k]) => k !== "institutionalPurpose"),
    );
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, institutionalPurpose: "desc" })).toBe(true);
  });

  it("purpose OTHER → requires otherPurpose", () => {
    const data = { ...validBase, purpose: "OTHER" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, otherPurpose: "desc" })).toBe(true);
  });

  it("usesPersonalData NO → requires usesThirdPartyPersonalData", () => {
    const data = Object.fromEntries(
      Object.entries(validBase).filter(
        ([k]) => k !== "usesThirdPartyPersonalData",
      ),
    );
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, usesThirdPartyPersonalData: "NO" })).toBe(true);
  });

  it("usesPersonalData NO + usesThirdPartyPersonalData YES → requires usesThirdPartyConfidentialData", () => {
    const data = {
      ...validBase,
      usesThirdPartyPersonalData: "YES",
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, usesThirdPartyConfidentialData: "NO" })).toBe(
      true,
    );
  });

  it("isRequestOnBehalfOfThirdParties YES → requires thirdPartiesRequestDataUsage", () => {
    const data = {
      ...validBase,
      isRequestOnBehalfOfThirdParties: "YES",
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, thirdPartiesRequestDataUsage: "PA_ONLY" })).toBe(
      true,
    );
  });

  describe("usesPersonalData YES cascades", () => {
    const personalDataBase = {
      ...validBase,
      checkedExistenceMereCorrectnessInteropCatalogue: "false",
      confirmPrincipleIntegrityAndDiscretion: "false",
      dataDownload: "NO",
      declarationConfirmGDPR: "false",
      deliveryMethod: "CLEARTEXT",
      doneDpia: "NO",
      knowsDataQuantity: "NO",
      legalBasis: ["CONSENT"],
      personalDataTypes: ["WITH_IDENTIFYING_DATA"],
      policyProvided: "YES",
      policyProvidedMedium: "PRINT",
      purposePursuit: "MERE_CORRECTNESS",
      usesPersonalData: "YES",
    };

    it("accepts full personal data path", () => {
      expect(validate(personalDataBase)).toBe(true);
    });

    it("usesPersonalData YES without required GDPR fields → fails", () => {
      const data = {
        ...validBase,
        usesPersonalData: "YES",
      };
      expect(validate(data)).toBe(false);
    });

    it("legalBasis PUBLIC_INTEREST + RULE_OF_LAW → requires ruleOfLawText", () => {
      const data = {
        ...personalDataBase,
        legalBasis: ["PUBLIC_INTEREST"],
        legalBasisPublicInterest: "RULE_OF_LAW",
      };
      expect(validate(data)).toBe(false);
      expect(validate({ ...data, ruleOfLawText: "text" })).toBe(true);
    });

    it("doneDpia YES → requires confirmedDoneDpia", () => {
      const data = { ...personalDataBase, doneDpia: "YES" };
      expect(validate(data)).toBe(false);
      expect(validate({ ...data, confirmedDoneDpia: "YES" })).toBe(true);
    });

    it("dataDownload YES → requires dataRetentionPeriod", () => {
      const data = { ...personalDataBase, dataDownload: "YES" };
      expect(validate(data)).toBe(false);
      expect(validate({ ...data, dataRetentionPeriod: "30 days" })).toBe(true);
    });
  });
});

describe("data-sharing data schema", () => {
  const validate = ajv.compile(dataSharingSchema);

  const validBase = {
    agreementType: "STANDARD",
    consentStatus: "NOT_APPLICABLE",
    dataCategories: ["FINANCIAL"],
    retentionPeriod: "1_YEAR",
    sharingScope: "INTERNAL",
  };

  it("accepts minimal valid data", () => {
    expect(validate(validBase)).toBe(true);
  });

  describe("rejects missing required fields", () => {
    it.each([
      "agreementType",
      "dataCategories",
      "sharingScope",
      "retentionPeriod",
      "consentStatus",
    ] as const)("missing %s", (field) => {
      const data = Object.fromEntries(
        Object.entries(validBase).filter(([k]) => k !== field),
      );
      expect(validate(data)).toBe(false);
    });
  });

  it("rejects invalid enum value", () => {
    expect(validate({ ...validBase, agreementType: "INVALID" })).toBe(false);
  });

  it("rejects wrong type for array field", () => {
    expect(validate({ ...validBase, dataCategories: "not-array" })).toBe(false);
  });

  it("rejects duplicate items in uniqueItems array", () => {
    expect(
      validate({ ...validBase, dataCategories: ["FINANCIAL", "FINANCIAL"] }),
    ).toBe(false);
  });

  it("rejects string exceeding maxLength", () => {
    expect(
      validate({
        ...validBase,
        additionalNotes: "x".repeat(2001),
      }),
    ).toBe(false);
  });

  it("accepts string at maxLength boundary", () => {
    expect(validate({ ...validBase, additionalNotes: "x".repeat(2000) })).toBe(
      true,
    );
  });
});

describe("data-sharing — conditional requirements", () => {
  const validate = ajv.compile(dataSharingSchema);

  const validBase = {
    agreementType: "STANDARD",
    consentStatus: "NOT_APPLICABLE",
    dataCategories: ["FINANCIAL"],
    retentionPeriod: "1_YEAR",
    sharingScope: "INTERNAL",
  };

  it("agreementType CUSTOM → requires customDescription", () => {
    const data = { ...validBase, agreementType: "CUSTOM" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, customDescription: "desc" })).toBe(true);
  });

  it("agreementType STANDARD → does not require customDescription", () => {
    expect(validate(validBase)).toBe(true);
  });

  it("dataCategories contains OTHER → requires otherDataCategories", () => {
    const data = { ...validBase, dataCategories: ["OTHER"] };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, otherDataCategories: "custom data" })).toBe(
      true,
    );
  });

  it("sharingScope EXTERNAL → requires externalParties", () => {
    const data = { ...validBase, sharingScope: "EXTERNAL" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, externalParties: "Acme Corp" })).toBe(true);
  });

  it("sharingScope BOTH → requires externalParties", () => {
    const data = { ...validBase, sharingScope: "BOTH" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, externalParties: "Acme Corp" })).toBe(true);
  });

  it("sharingScope INTERNAL → does not require externalParties", () => {
    expect(validate(validBase)).toBe(true);
  });

  it("retentionPeriod INDEFINITE → requires retentionJustification", () => {
    const data = { ...validBase, retentionPeriod: "INDEFINITE" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, retentionJustification: "legal hold" })).toBe(
      true,
    );
  });

  it("retentionPeriod 1_YEAR → does not require retentionJustification", () => {
    expect(validate(validBase)).toBe(true);
  });

  it("encryptionRequired true → requires encryptionMethod", () => {
    const data = { ...validBase, encryptionRequired: "true" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, encryptionMethod: "AES_256" })).toBe(true);
  });

  it("encryptionRequired false → does not require encryptionMethod", () => {
    expect(validate({ ...validBase, encryptionRequired: "false" })).toBe(true);
  });

  it("encryptionMethod OTHER → requires otherEncryptionMethod", () => {
    const data = {
      ...validBase,
      encryptionMethod: "OTHER",
      encryptionRequired: "true",
    };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, otherEncryptionMethod: "ChaCha20" })).toBe(true);
  });

  it("consentStatus OBTAINED → requires consentReference", () => {
    const data = { ...validBase, consentStatus: "OBTAINED" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, consentReference: "REF-001" })).toBe(true);
  });

  it("consentStatus NOT_OBTAINED → requires noConsentReason", () => {
    const data = { ...validBase, consentStatus: "NOT_OBTAINED" };
    expect(validate(data)).toBe(false);
    expect(validate({ ...data, noConsentReason: "pending approval" })).toBe(
      true,
    );
  });

  it("consentStatus NOT_APPLICABLE → requires neither", () => {
    expect(validate(validBase)).toBe(true);
  });
});
