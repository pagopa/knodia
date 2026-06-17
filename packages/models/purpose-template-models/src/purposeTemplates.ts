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

// E-service IDs seeded in the Orion namespace by scripts/seed/sql/orion/*.sql.
// These match the "Mockup 01" (bearer-token, date-of-birth) and "Mockup 02"
// (DPoP-token, digital-contact) mock e-services referenced by the
// purpose-template deliverables on Confluence.
const ORION_MOCKUP_01_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "e7f5837e-75f4-431d-9465-73366d27bef2",
);
const ORION_MOCKUP_02_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "905c4569-95db-4670-a146-8239fcb3f41a",
);
// E-service ID seeded in the Lynx namespace by scripts/seed/sql/lynx/*.sql.
// This is the POC UC02 "Company Information & Evidence" cross-border
// e-service, which the Lynx purpose-template deliverable on Confluence
// targets as "mockup 05".
const LYNX_MOCKUP_05_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "16895bc2-deb0-427c-8c25-336207b2d0a1",
);

/** @knipignore */
const purposeTemplates: Record<KnodeId, PurposeTemplate[]> = {
  Lynx: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Retrieval of identifying personal data to fulfil a legal obligation when delivering a digital service.",
      },
      formAnswersJson: {
        checkedExistenceMereCorrectnessInteropCatalogue: "true",
        confirmPrincipleIntegrityAndDiscretion: "true",
        dataDownload: "NO",
        dataQuantity: "QUANTITY_0_TO_100",
        declarationConfirmGDPR: "true",
        deliveryMethod: "CLEARTEXT",
        doneDpia: "NO",
        institutionalPurpose:
          "Delivery of a digital service that requires processing identifying personal data.",
        isRequestOnBehalfOfThirdParties: "NO",
        knowsDataQuantity: "YES",
        legalBasis: ["LEGAL_OBLIGATION"],
        legalObligationReference:
          "Art. 6, par. 1, lett. c) GDPR — legal obligation to deliver the service.",
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        policyProvided: "YES",
        policyProvidedMedium: "ONLINE",
        policyProvidedOnlineLink: "https://www.example.gov/privacy-policy",
        purpose: "INSTITUTIONAL",
        purposePursuit: "MERE_CORRECTNESS",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "40152bed-7484-4525-9354-bc5cf6873d0d",
      ),
      name: { en: "Service delivery with identifying personal data" },
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Bulk retrieval of company contact points for non-institutional communications.",
      },
      eserviceId: LYNX_MOCKUP_05_ESERVICE_ID,
      formAnswersJson: {
        isRequestOnBehalfOfThirdParties: "NO",
        otherPurpose: "Bulk forwarding of communications to companies.",
        purpose: "OTHER",
        usesPersonalData: "NO",
        usesThirdPartyNonPersonalData: "NO",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "3f225e6a-9db7-4d5a-bb5c-4a1bf6df0e16",
      ),
      name: { en: "Bulk forwarding of communications to companies" },
    },
  ],
  Orion: [
    {
      createdAt: new Date("2025-01-01T00:00:00Z"),
      description: {
        en: "Retrieval of personal data to support analyses aimed at improving the efficiency of the entity's digital services.",
      },
      formAnswersJson: {
        declarationConfirmGDPR: "true",
        institutionalPurpose:
          "Analysis of information flows to improve the efficiency of the entity's digital services.",
        legalBasis: ["LEGAL_OBLIGATION", "PUBLIC_INTEREST"],
        legalObligationReference:
          "Art. 6, par. 1, lett. c) GDPR — obligation to safeguard the security of information systems.",
        otherPersonalDataTypes:
          "Personal data used solely for internal security purposes.",
        personalDataTypes: ["WITH_IDENTIFYING_DATA", "GDPR_ART_9", "OTHER"],
        purpose: "INSTITUTIONAL",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "f360e76e-87d4-41a1-8ffd-3ca23dbb095e",
      ),
      name: { en: "Information flows analysis" },
    },
    {
      createdAt: new Date("2025-01-02T00:00:00Z"),
      description: {
        en: "Retrieval of the date of birth of a natural person for issuance or renewal of the identity card.",
      },
      eserviceId: ORION_MOCKUP_01_ESERVICE_ID,
      formAnswersJson: {
        declarationConfirmGDPR: "true",
        institutionalPurpose:
          "Retrieval of date of birth for issuance or renewal of the identity card.",
        legalBasis: ["LEGAL_OBLIGATION"],
        legalObligationReference: "Royal Decree 18 June 1931, no. 773.",
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        purpose: "INSTITUTIONAL",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "4f552baa-db7e-4807-aa68-1cdb0fe67c53",
      ),
      name: { en: "Identity card issuance or renewal" },
    },
    {
      createdAt: new Date("2025-01-03T00:00:00Z"),
      description: {
        en: "Retrieval of the digital contact of a natural person to notify a Highway Code sanctioning procedure.",
      },
      eserviceId: ORION_MOCKUP_02_ESERVICE_ID,
      formAnswersJson: {
        declarationConfirmGDPR: "true",
        institutionalPurpose:
          "Retrieval of a natural person's digital contact to notify a sanctioning procedure for a Highway Code violation.",
        legalBasis: ["LEGAL_OBLIGATION"],
        legalObligationReference:
          "Article 201 of Legislative Decree 30 April 1992, no. 285.",
        personalDataTypes: ["WITH_IDENTIFYING_DATA"],
        purpose: "INSTITUTIONAL",
        usesPersonalData: "YES",
      },
      formSchemaVersion: "1.0",
      id: unsafeBrandId<PurposeTemplateId>(
        "9f5f71b6-ac03-4711-bc17-0fa9778df112",
      ),
      name: { en: "Highway Code violation notice" },
    },
  ],
};

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
