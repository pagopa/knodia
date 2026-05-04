import {
  EserviceId,
  type KnodeId,
  PurposeStatementTemplateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  LocalizedPurposeDescription,
  LocalizedPurposeName,
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import z from "zod";

export const PurposeFormVariant = z.enum(["basic", "withriskanalysis"]);
export type PurposeFormVariant = z.infer<typeof PurposeFormVariant>;

/** @knipignore */
export const PurposeStatementTemplate = z.strictObject({
  createdAt: z.coerce.date(),
  description: LocalizedPurposeDescription,
  // undefined = generic template for the Knode (not tied to a specific eservice)
  eserviceId: EserviceId.optional(),
  formAnswers: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
  id: PurposeStatementTemplateId,
  name: LocalizedPurposeName,
  purposeFormVariant: PurposeFormVariant,
});
export type PurposeStatementTemplate = z.infer<typeof PurposeStatementTemplate>;

// TODO: align with eservice mocks once they exist with stable UUIDs
const PLACEHOLDER_ESERVICE_ORION_01 = unsafeBrandId<EserviceId>(
  "11111111-1111-4111-8111-000000000001",
);
const PLACEHOLDER_ESERVICE_ORION_02 = unsafeBrandId<EserviceId>(
  "11111111-1111-4111-8111-000000000002",
);
const PLACEHOLDER_ESERVICE_LYNX_05 = unsafeBrandId<EserviceId>(
  "11111111-1111-4111-8111-000000000005",
);

/** @knipignore */
const purposeStatementTemplates: Record<KnodeId, PurposeStatementTemplate[]> = {
  Lynx: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Generic basic-form blueprint for routine institutional consultation of citizen data.",
      },
      formAnswers: {
        declarationConfirmGDPR: "true",
        institutionalPurpose:
          "Routine consultation of citizen registry data for institutional duties.",
        legalBasis: ["CONSENT"],
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        purpose: "INSTITUTIONAL",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeStatementTemplateId>(
        "a1b2c3d4-0001-4000-8000-000000000001",
      ),
      name: { en: "Generic citizen data consultation (basic)" },
      purposeFormVariant: "basic",
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for cross-border consumption of Lynx citizen residence data.",
      },
      eserviceId: PLACEHOLDER_ESERVICE_LYNX_05,
      formAnswers: {
        checkedExistenceMereCorrectnessInteropCatalogue: "true",
        confirmPrincipleIntegrityAndDiscretion: "true",
        dataDownload: "NO",
        declarationConfirmGDPR: "true",
        deliveryMethod: "PSEUDOANONYMOUS",
        doneDpia: "NO",
        institutionalPurpose:
          "Cross-border consultation of citizen residence place for administrative procedures.",
        isRequestOnBehalfOfThirdParties: "NO",
        knowsDataQuantity: "NO",
        legalBasis: ["PUBLIC_INTEREST"],
        legalBasisPublicInterest: "RULE_OF_LAW",
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        policyProvided: "YES",
        policyProvidedMedium: "ONLINE",
        policyProvidedOnlineLink: "https://example.org/privacy-policy",
        purpose: "INSTITUTIONAL",
        purposePursuit: "MERE_CORRECTNESS",
        ruleOfLawText: "Reg. (EU) 910/2014 (eIDAS), Art. 12.",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeStatementTemplateId>(
        "a1b2c3d4-0001-4000-8000-000000000002",
      ),
      name: { en: "Lynx residence cross-border consumption" },
      purposeFormVariant: "withriskanalysis",
    },
  ],
  Orion: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for institutional consumption of public administration data.",
      },
      formAnswers: {
        checkedExistenceMereCorrectnessInteropCatalogue: "true",
        confirmPrincipleIntegrityAndDiscretion: "true",
        dataDownload: "NO",
        declarationConfirmGDPR: "true",
        deliveryMethod: "CLEARTEXT",
        doneDpia: "NO",
        institutionalPurpose:
          "Institutional consultation of public administration registries.",
        isRequestOnBehalfOfThirdParties: "NO",
        knowsDataQuantity: "NO",
        legalBasis: ["CONSENT"],
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        policyProvided: "YES",
        policyProvidedMedium: "PRINT",
        purpose: "INSTITUTIONAL",
        purposePursuit: "MERE_CORRECTNESS",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeStatementTemplateId>(
        "a1b2c3d4-0002-4000-8000-000000000001",
      ),
      name: { en: "Generic PA consultation (with risk analysis)" },
      purposeFormVariant: "withriskanalysis",
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for cross-border consumption of Orion PA address data.",
      },
      eserviceId: PLACEHOLDER_ESERVICE_ORION_01,
      formAnswers: {
        checkedExistenceMereCorrectnessInteropCatalogue: "true",
        confirmPrincipleIntegrityAndDiscretion: "true",
        dataDownload: "YES",
        dataQuantity: "QUANTITY_500_TO_1000",
        dataRetentionPeriod: "12 months from issuance.",
        declarationConfirmGDPR: "true",
        deliveryMethod: "CLEARTEXT",
        doneDpia: "NO",
        institutionalPurpose:
          "Cross-border consultation of public administration addresses for routing official communications.",
        isRequestOnBehalfOfThirdParties: "NO",
        knowsDataQuantity: "YES",
        legalBasis: ["LEGAL_OBLIGATION"],
        legalObligationReference:
          "National Code of Digital Administration, art. 47 bis.",
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        policyProvided: "YES",
        policyProvidedMedium: "ONLINE",
        policyProvidedOnlineLink: "https://example.org/privacy-policy",
        purpose: "INSTITUTIONAL",
        purposePursuit: "MERE_CORRECTNESS",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeStatementTemplateId>(
        "a1b2c3d4-0002-4000-8000-000000000002",
      ),
      name: { en: "Orion PA address cross-border consumption" },
      purposeFormVariant: "withriskanalysis",
    },
    {
      createdAt: new Date("2025-01-03T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for cross-border consumption of Orion PA typology data.",
      },
      eserviceId: PLACEHOLDER_ESERVICE_ORION_02,
      formAnswers: {
        administrativeActText:
          "Council Decision 2009/917/JHA on use of information technology for customs purposes.",
        checkedExistenceMereCorrectnessInteropCatalogue: "true",
        confirmPrincipleIntegrityAndDiscretion: "true",
        dataDownload: "NO",
        declarationConfirmGDPR: "true",
        deliveryMethod: "AGGREGATE",
        doneDpia: "NO",
        institutionalPurpose:
          "Cross-border statistical analysis of public administration typology.",
        isRequestOnBehalfOfThirdParties: "NO",
        knowsDataQuantity: "NO",
        legalBasis: ["PUBLIC_INTEREST"],
        legalBasisPublicInterest: "ADMINISTRATIVE_ACT",
        personalDataTypes: ["WITH_NON_IDENTIFYING_DATA"],
        policyProvided: "YES",
        policyProvidedMedium: "ONLINE",
        policyProvidedOnlineLink: "https://example.org/privacy-policy",
        purpose: "INSTITUTIONAL",
        purposePursuit: "MERE_CORRECTNESS",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeStatementTemplateId>(
        "a1b2c3d4-0002-4000-8000-000000000003",
      ),
      name: { en: "Orion PA typology cross-border statistics" },
      purposeFormVariant: "withriskanalysis",
    },
  ],
};

/** @knipignore */
export function getPurposeStatementTemplate(
  id: PurposeStatementTemplateId,
  knodeId: KnodeId,
): PurposeStatementTemplate | undefined {
  return purposeStatementTemplates[knodeId].find(
    (template) => template.id === id,
  );
}

/**
 * @knipignore
 *
 * Without `opts.eserviceId`, returns every template registered for the Knode
 * (generic + eservice-specific). With `opts.eserviceId`, returns generic
 * templates plus the specifics matching that eservice.
 */
export function getPurposeStatementTemplates(
  knodeId: KnodeId,
  opts?: { eserviceId: EserviceId },
): PurposeStatementTemplate[] {
  const all = purposeStatementTemplates[knodeId];
  if (opts === undefined) return all;
  return all.filter(
    (template) =>
      template.eserviceId === undefined ||
      template.eserviceId === opts.eserviceId,
  );
}
