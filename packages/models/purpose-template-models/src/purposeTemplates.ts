import {
  EserviceId,
  type KnodeId,
  PurposeTemplateId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import {
  LocalizedPurposeDescription,
  LocalizedPurposeName,
  PurposeFormAnswers,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import z from "zod";

/** @knipignore */
export const PurposeTemplate = z.strictObject({
  createdAt: z.coerce.date(),
  description: LocalizedPurposeDescription,
  // undefined = generic template for the Knode (not tied to a specific eservice)
  eserviceId: EserviceId.optional(),
  formAnswersJson: PurposeFormAnswers,
  formSchemaVersion: PurposeFormSchemaVersion,
  id: PurposeTemplateId,
  name: LocalizedPurposeName,
});
export type PurposeTemplate = z.infer<typeof PurposeTemplate>;

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
const purposeTemplates: Record<KnodeId, PurposeTemplate[]> = {
  Lynx: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Generic basic-form blueprint for routine institutional consultation of citizen data.",
      },
      formAnswersJson: {
        declarationConfirmGDPR: "true",
        institutionalPurpose:
          "Routine consultation of citizen registry data for institutional duties.",
        legalBasis: ["CONSENT"],
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        purpose: "INSTITUTIONAL",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "a1b2c3d4-0001-4000-8000-000000000001",
      ),
      name: { en: "Generic citizen data consultation (basic)" },
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Basic-form blueprint for cross-border consultation of Lynx citizen residence data.",
      },
      eserviceId: PLACEHOLDER_ESERVICE_LYNX_05,
      formAnswersJson: {
        declarationConfirmGDPR: "true",
        institutionalPurpose:
          "Cross-border consultation of citizen residence place for administrative procedures.",
        legalBasis: ["PUBLIC_INTEREST"],
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        purpose: "INSTITUTIONAL",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "a1b2c3d4-0001-4000-8000-000000000002",
      ),
      name: { en: "Lynx residence cross-border consultation (basic)" },
    },
  ],
  Orion: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for institutional consumption of public administration data.",
      },
      formAnswersJson: {
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
      id: unsafeBrandId<PurposeTemplateId>(
        "a1b2c3d4-0002-4000-8000-000000000001",
      ),
      name: { en: "Generic PA consultation (with risk analysis)" },
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for cross-border consumption of Orion PA address data.",
      },
      eserviceId: PLACEHOLDER_ESERVICE_ORION_01,
      formAnswersJson: {
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
      id: unsafeBrandId<PurposeTemplateId>(
        "a1b2c3d4-0002-4000-8000-000000000002",
      ),
      name: { en: "Orion PA address cross-border consumption" },
    },
    {
      createdAt: new Date("2025-01-03T00:00:00Z"),
      description: {
        en: "Risk-analysis blueprint for cross-border consumption of Orion PA typology data.",
      },
      eserviceId: PLACEHOLDER_ESERVICE_ORION_02,
      formAnswersJson: {
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
      id: unsafeBrandId<PurposeTemplateId>(
        "a1b2c3d4-0002-4000-8000-000000000003",
      ),
      name: { en: "Orion PA typology cross-border statistics" },
    },
  ],
};

/** @knipignore */
export function getPurposeTemplate(
  id: PurposeTemplateId,
  knodeId: KnodeId,
): PurposeTemplate | undefined {
  return purposeTemplates[knodeId].find((template) => template.id === id);
}

/**
 * Returns templates registered for the Knode, with optional independent filters:
 * - `formSchemaVersion`: matches templates with the same version (typed `string` since the BFF receives it as opaque from a remote service).
 * - `eserviceId`: returns generic templates (`eserviceId === undefined`) plus those tied to that eservice.
 */
export function getPurposeTemplates(
  knodeId: KnodeId,
  formSchemaVersion?: string,
  eserviceId?: EserviceId,
): PurposeTemplate[] {
  const templatesWithCorrectVersion = purposeTemplates[knodeId].filter(
    (template) =>
      formSchemaVersion === undefined ||
      template.formSchemaVersion === formSchemaVersion,
  );

  if (eserviceId === undefined) {
    return templatesWithCorrectVersion;
  }

  return templatesWithCorrectVersion.filter(
    (template) =>
      template.eserviceId === undefined || template.eserviceId === eserviceId,
  );
}
