import {
  DIGEST_HEADER,
  KNODIA_JWT_SIGNATURE_HEADER,
} from "@knodia/integrity-rest-02/models";
import z from "zod";

const CODICE_FISCALE_REGEX =
  /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;

export const API_Notation = z.string().regex(CODICE_FISCALE_REGEX).meta({
  description:
    "Italian Codice Fiscale, uppercase only. Acts as the natural-person identifier in the path.",
  example: "RMNLNR03H12H501Z",
  id: "Notation",
});
export type API_Notation = z.infer<typeof API_Notation>;

const API_UriScheme = z
  .enum(["http://memberstate.ms/PIdentifier", "http://memberstate.ms/VAT"])
  .meta({
    description: "Identifier scheme URI accepted by Knodia mock e-services",
    id: "UriScheme",
  });

const API_Identifier = z
  .strictObject({
    notation: API_Notation,
    schemeName: z.string(),
    schemeURI: API_UriScheme,
  })
  .meta({
    description:
      "Globally unique identifier of an entity (Core Person Vocabulary 2.1.1)",
    id: "Identifier",
  });

// GeoNames place URI. Accepts the human-facing forms (geonames.org /
// www.geonames.org) and the canonical Linked-Data form (sws.geonames.org/<id>/),
// so a malformed or non-GeoNames URL is rejected at load. The numeric id is not
// resolved against GeoNames — that would require a network call.
const API_GeoNamesUri = z
  .url()
  .regex(/^https:\/\/(www\.|sws\.)?geonames\.org\/\d+\/?$/)
  .meta({
    description: "GeoNames place identifier URI",
    example: "https://www.geonames.org/3165456",
    id: "GeoNamesUri",
  });

const API_Location = z
  .strictObject({
    geographicIdentifier: API_GeoNamesUri,
    geographicName: z.string(),
  })
  .meta({
    description:
      "Geographic place, modelled after Core Person Vocabulary 2.1.1 (GeoNames URI + name)",
    id: "Location",
  });

const API_Sex = z.enum(["FEMALE", "MALE", "NAP", "NKN", "NST"]).meta({
  description:
    "Sex of a natural person (derived from the EU human-sex authority vocabulary)",
  id: "Sex",
});

export const API_NaturalPerson = z
  .strictObject({
    alternativeName: z.array(z.string()).optional(),
    dateOfBirth: z.iso.date(),
    dateOfDeath: z.iso.date().optional(),
    familyName: z.string(),
    givenName: z.string(),
    identifier: API_Identifier,
    placeOfBirth: API_Location,
    placeOfDeath: API_Location.optional(),
    sex: API_Sex,
  })
  .meta({
    description: "Natural person, modelled after Core Person Vocabulary 2.1.1",
    id: "NaturalPerson",
  });
export type API_NaturalPerson = z.infer<typeof API_NaturalPerson>;

export const API_ContactPoint = z
  .strictObject({
    hasEmail: z.email().optional(),
    hasTelephone: z.string().optional(),
  })
  .meta({
    description:
      "Digital contact point of a natural person (Core Person Vocabulary 2.1.1)",
    id: "ContactPoint",
  });
export type API_ContactPoint = z.infer<typeof API_ContactPoint>;

export const API_PersonalInformation = z
  .strictObject({
    dateOfBirth: z.iso.date(),
  })
  .meta({
    description:
      "Personal information returned by the Cross-Border E-service 01",
    id: "PersonalInformation",
  });
export type API_PersonalInformation = z.infer<typeof API_PersonalInformation>;

export const API_DigitalContact = z
  .strictObject({
    contactPoint: API_ContactPoint,
    naturalPerson: API_NaturalPerson,
  })
  .meta({
    description: "Digital contact returned by the Cross-Border E-service 02",
    id: "DigitalContact",
  });
export type API_DigitalContact = z.infer<typeof API_DigitalContact>;

export const API_Address = z
  .strictObject({
    adminUnitL1: z.string(),
    adminUnitL2: z.string(),
    fullAddress: z.string(),
    postCode: z.string().optional(),
    postName: z.string().optional(),
  })
  .meta({
    description:
      "Address, modelled after Core Person Vocabulary 2.1.1 / Core Business Vocabulary 2.2.0",
    id: "Address",
  });
export type API_Address = z.infer<typeof API_Address>;

export const API_Residence = z
  .strictObject({
    address: API_Address,
    naturalPerson: API_NaturalPerson,
  })
  .meta({
    description: "Residence returned by the Cross-Border E-service 03",
    id: "Residence",
  });
export type API_Residence = z.infer<typeof API_Residence>;

export const API_Pseudonymization = z
  .strictObject({
    cryptoHashFunction: z.literal("sha256"),
    seed: z.string().min(1),
  })
  .meta({
    description:
      "Pseudonymization parameters used by the Producer to publish Signal Hub signals for the resources managed by this e-service",
    id: "Pseudonymization",
  });
export type API_Pseudonymization = z.infer<typeof API_Pseudonymization>;

export const API_CompanyUid = z
  .string()
  .regex(/^[0-9]{11}$/)
  .meta({
    description:
      "Legal-entity identifier in the path: 11-digit Italian VAT number (Partita IVA).",
    example: "01229430085",
    id: "CompanyUid",
  });
export type API_CompanyUid = z.infer<typeof API_CompanyUid>;

const API_LegalIdentifier = z
  .strictObject({
    notation: API_CompanyUid,
    schemeName: z.string(),
    schemeURI: API_UriScheme,
  })
  .meta({
    description:
      "Unique identifier of a legal entity (Core Business Vocabulary 2.2.0)",
    id: "LegalIdentifier",
  });

// Modelled as a string in the API: the value is an ATECO 2025 category code,
// validated at load time against the known codes in models/legalEntityActivities.ts
// (the full code list would bloat the OpenAPI enum to no benefit for consumers).
const API_LegalEntityActivity = z.string().meta({
  description:
    "Economic activity of the legal entity — ATECO 2025 classification code (6-digit category level, with NACE Rev. 2.1 correspondence)",
  example: "43.22.07",
  id: "LegalEntityActivity",
});

export const API_LegalEntity = z
  .strictObject({
    legalEntityActivity: API_LegalEntityActivity,
    legalIdentifier: API_LegalIdentifier,
    legalName: z.string(),
    registrationDate: z.iso.date().optional(),
  })
  .meta({
    description:
      "Legal entity (company), modelled after Core Business Vocabulary 2.2.0",
    id: "LegalEntity",
  });
export type API_LegalEntity = z.infer<typeof API_LegalEntity>;

export const API_EvidenceType = z.enum([
  "codeETC_001",
  "codeETC_002",
  "codeETC_003",
  "codeETC_004",
]);
export type API_EvidenceType = z.infer<typeof API_EvidenceType>;

export const evidenceTypeIdentifiers: Record<API_EvidenceType, string> = {
  codeETC_001: "complianceLegalObligations",
  codeETC_002: "liftControl",
  codeETC_003: "competenceRequirements",
  codeETC_004: "electricVehicleChargingEquipment",
};

const API_EvidenceTypeClassification = z
  .strictObject({
    evidenceTypeClassification: API_EvidenceType,
    identifier: z.string(),
  })
  .meta({
    description: "Type of evidence (CCCEV 2.1.0)",
    id: "EvidenceTypeClassification",
  });

export const API_PeriodOfTime = z
  .strictObject({
    endtime: z.iso.date().optional(),
    starttime: z.iso.date(),
  })
  .meta({
    description:
      "Period of time during which an evidence is valid (CCCEV 2.1.0)",
    id: "PeriodOfTime",
  });
export type API_PeriodOfTime = z.infer<typeof API_PeriodOfTime>;

export const API_Evidence = z
  .strictObject({
    isAbout: API_LegalEntity,
    isConformantTo: API_EvidenceTypeClassification,
    validityPeriod: API_PeriodOfTime,
  })
  .meta({
    description: "Evidence about a legal entity (CCCEV 2.1.0)",
    id: "Evidence",
  });
export type API_Evidence = z.infer<typeof API_Evidence>;

// POC UC01 qualifications — student/location/identifier modelled after Core
// Person Vocabulary 2.1.1, qualification/organisation after the European
// Learning Model 3.3.1. Reuses API_Location and API_Sex defined above.
export const API_StudentUid = z
  .string()
  .regex(/^[0-9]{8}$/)
  .meta({
    description:
      "Student identifier in the path: 8-digit national student-registry matricola.",
    example: "00132423",
    id: "StudentUid",
  });
export type API_StudentUid = z.infer<typeof API_StudentUid>;

const API_StudentUriScheme = z
  .enum(["http://studentRegistryLynx/UIDStudent"])
  .meta({
    description: "Identifier scheme URI of the national student registry",
    id: "StudentUriScheme",
  });

const API_StudentIdentifier = z
  .strictObject({
    notation: API_StudentUid,
    schemeName: z.string(),
    schemeURI: API_StudentUriScheme,
  })
  .meta({
    description:
      "Unique identifier of a student (Core Person Vocabulary 2.1.1)",
    id: "StudentIdentifier",
  });

const API_EQFLevel = z
  .enum([
    "level01",
    "level02",
    "level03",
    "level04",
    "level05",
    "level06",
    "level07",
    "level08",
  ])
  .meta({
    description: "European Qualifications Framework level (8-level scale)",
    id: "EQFLevel",
  });

export const API_ISCEDFCode = z
  .enum(["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10"])
  .meta({
    description: "ISCED-F broad field of education and training code",
    id: "ISCEDFCode",
  });
export type API_ISCEDFCode = z.infer<typeof API_ISCEDFCode>;

const API_Organisation = z
  .strictObject({
    legalName: z.string(),
    location: API_Location,
  })
  .meta({
    description:
      "Organisation (tertiary education institute), modelled after the European Learning Model 3.3.1",
    id: "Organisation",
  });

export const API_Qualification = z
  .strictObject({
    EQFLevel: API_EQFLevel,
    ISCEDFCode: z.array(API_ISCEDFCode).min(1),
    publisher: API_Organisation,
    title: z.string(),
  })
  .meta({
    description:
      "Qualification (learning outcome), modelled after the European Learning Model 3.3.1",
    id: "Qualification",
  });
export type API_Qualification = z.infer<typeof API_Qualification>;

export const API_Student = z
  .strictObject({
    dateOfBirth: z.iso.date(),
    familyName: z.string(),
    givenName: z.string(),
    placeOfBirth: API_Location,
    sex: API_Sex,
    uidStudent: API_StudentIdentifier,
  })
  .meta({
    description: "Student, modelled after Core Person Vocabulary 2.1.1",
    id: "Student",
  });
export type API_Student = z.infer<typeof API_Student>;

export const API_QualificationAck = z
  .strictObject({
    acknowledged: z.literal(true),
    uidStudent: API_StudentUid,
  })
  .meta({
    description:
      "Acknowledgement returned by setQualification after the registry accepts the new qualification",
    id: "QualificationAck",
  });
export type API_QualificationAck = z.infer<typeof API_QualificationAck>;

export const API_SendDigitalContactRequest = z
  .strictObject({
    contactPoint: API_ContactPoint,
    legalEntity: API_LegalEntity,
  })
  .meta({
    description:
      "Submission of the digital contact point of a legal entity to the Producer (Cross-Border E-service 04, Receive data).",
    id: "SendDigitalContactRequest",
  });
export type API_SendDigitalContactRequest = z.infer<
  typeof API_SendDigitalContactRequest
>;

export const API_Ack = z
  .strictObject({
    correlationId: z.uuid(),
    receivedAt: z.iso.datetime(),
  })
  .meta({
    description:
      "Acknowledgment returned by the Producer upon successful receipt of a digital-contact submission.",
    id: "Ack",
  });
export type API_Ack = z.infer<typeof API_Ack>;

export const API_CompanyUidPathParam = z.strictObject({
  uidCompany: API_CompanyUid,
});

export const API_CompanyAddress = z
  .strictObject({
    address: API_Address,
    legalEntity: API_LegalEntity,
  })
  .meta({
    description: "Address of a company in the registry",
    id: "CompanyAddress",
  });
export type API_CompanyAddress = z.infer<typeof API_CompanyAddress>;

const API_IntegrityRest02DigestHeader = z.string().meta({
  description:
    "Digest of the body using the canonical JSON representation of the response body. The digest is calculated using the SHA-256 algorithm on the response body exactly as it is sent to the client, encoded in Base64 as per RFC 3230.",
  id: "IntegrityRest02DigestHeader",
});

const API_IntegrityRest02KnodiaJwtSignatureHeader = z.jwt().meta({
  description: `The \`Knodia-JWT-Signature\` header contains a JSON Web Signature (JWS) signed with the E-service Producer private key. It ensures payload integrity and non-repudiation across all responses (both success and error), in compliance with: 1) Linee Guida sull'interoperabilità tecnica delle Pubbliche Amministrazioni - Pattern di sicurezza, 2) RFC 7515, 3) RFC 7519`,
  id: "IntegrityRest02KnodiaJwtSignatureHeader",
});

export const API_IntegrityRest02Headers = z
  .object({
    [DIGEST_HEADER]: API_IntegrityRest02DigestHeader,
    [KNODIA_JWT_SIGNATURE_HEADER]: API_IntegrityRest02KnodiaJwtSignatureHeader,
  })
  .meta({
    description:
      "Response headers required by the Cross-Border E-service 06 (Integrity Rest 02) specification",
  });

export const API_CompanyAddressesRequest = z.array(API_CompanyUid).meta({
  description:
    "Submission of a list of legal-entity identifiers to the Producer, to request their registered addresses (Cross-Border E-service 05, Request company addresses).",
  id: "CompanyAddressesRequest",
});
export type API_CompanyAddressesRequest = z.infer<
  typeof API_CompanyAddressesRequest
>;

export const API_AsyncConsumptionRequestStatus = z
  .enum(["PENDING", "COMPLETED"])
  .meta({
    description:
      "Status of an asynchronous request to the Producer (Cross-Border E-service 05, Request company addresses).",
    id: "AsyncConsumptionRequestStatus",
  });
export type API_AsyncConsumptionRequestStatus = z.infer<
  typeof API_AsyncConsumptionRequestStatus
>;

export const API_AsyncConsumptionRequestId = z.uuid().meta({
  description:
    "Unique identifier of an asynchronous request to the Producer (Cross-Border E-service 05, Request company addresses).",
  id: "AsyncConsumptionRequestId",
});

const API_AsyncConsumptionResourceId = z.uuid().meta({
  description:
    "Unique identifier of the resource generated by the Producer in response to an asynchronous request (Cross-Border E-service 05, Request company addresses).",
  id: "AsyncConsumptionResourceId",
});

export const API_GetCompanyAddressesRequestStatusResponse = z.strictObject({
  resourceId: API_AsyncConsumptionResourceId.optional(),
  status: API_AsyncConsumptionRequestStatus,
});
export type API_GetCompanyAddressesRequestStatusResponse = z.infer<
  typeof API_GetCompanyAddressesRequestStatusResponse
>;
