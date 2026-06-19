import { KnodeId } from "@knodia/common-models/ids";
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

const API_Location = z
  .strictObject({
    geographicIdentifier: z.url(),
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

// --- POC UC03 (ERDS relay) ---

// The two SERCs of the POC, identified by name (ETSI EN 319 522-2 erdsIdentifier).
export const API_ErdsIdentifier = z
  .enum(["systemSERCLynx", "systemSERCOrion"])
  .meta({
    description:
      "Identifier of an Electronic Registered Delivery Service (SERC) in the POC",
    id: "ErdsIdentifier",
  });
export type API_ErdsIdentifier = z.infer<typeof API_ErdsIdentifier>;

// Recipient identifier passed to lookupERDS (def-page IDENTIFIER entity). The
// notation is generic text, not the Codice-Fiscale-only API_Notation above:
// recipients can be identified by VAT (e.g. the sample 01229430085).
// No meta id: used as the lookupERDS querystring, which must inline into query
// params rather than become a $ref component.
export const API_ErdsRecipientIdentifier = z.strictObject({
  notation: z.string().min(1),
  schemeName: z.string().min(1),
  schemeURI: API_UriScheme,
});
export type API_ErdsRecipientIdentifier = z.infer<
  typeof API_ErdsRecipientIdentifier
>;

export const API_ErdsLookupResult = z
  .strictObject({
    erdsIdentifier: API_ErdsIdentifier,
  })
  .meta({
    description: "The SERC that serves the looked-up recipient (lookupERDS).",
    id: "ErdsLookupResult",
  });
export type API_ErdsLookupResult = z.infer<typeof API_ErdsLookupResult>;

export const API_ErdsMetadata = z
  .strictObject({
    domainName: z.string().meta({
      description: "Domain name of the SERC (ETSI EN 319 522-2)",
      example: "systemSERCOrion",
    }),
    eserviceId: z.uuid(),
    identifier: API_ErdsIdentifier,
    knodeId: KnodeId,
  })
  .meta({
    description:
      "Metadata of an Electronic Registered Delivery Service (getERDSMetadata): its domain name and the knode/e-service that publish its relay.",
    id: "ErdsMetadata",
  });
export type API_ErdsMetadata = z.infer<typeof API_ErdsMetadata>;

// erd_dispatch — the payload relayed between SERCs (ETSI EN 319 522-2).

// Globally unique identifier of a party (sender/recipient). Same shape as the
// existing Identifier but the notation is free text (a recipient may be a VAT,
// a fiscal code, etc.), so it is not the Codice-Fiscale-restricted API_Notation.
const API_ErdsPartyIdentifier = z
  .strictObject({
    notation: z.string().min(1),
    schemeName: z.string().min(1),
    schemeURI: API_UriScheme,
  })
  .meta({
    description:
      "Globally unique identifier of a party in an ERD dispatch (Core Person Vocabulary 2.1.1)",
    id: "ErdsPartyIdentifier",
  });

// Reference to a message or an evidence: a SERC plus a generated uuid (the def
// page's MSGIDENTIFIER and EVIDIDENTIFIER share this shape).
const API_ErdsRefIdentifier = z
  .strictObject({
    erdsIdentifier: API_ErdsIdentifier,
    uuid: z.uuid(),
  })
  .meta({
    description: "Reference to an ERD message or evidence (SERC + uuid)",
    id: "ErdsRefIdentifier",
  });

const API_ErdMessageType = z.enum(["Dispatch", "Receipt"]).meta({
  description: "Whether an ERD dispatch carries a message or its receipt",
  id: "ErdMessageType",
});
type API_ErdMessageType = z.infer<typeof API_ErdMessageType>;

const API_EventIdentifier = z
  .enum([
    "SubmissionAcceptance",
    "RelayAcceptance",
    "RelayRejection",
    "RelayFailure",
    "ContentConsignment",
    "ContentConsignmentFailure",
    "ContentHandover",
    "ContentHandoverFailure",
  ])
  .meta({ description: "ERDS evidence event", id: "EventIdentifier" });
type API_EventIdentifier = z.infer<typeof API_EventIdentifier>;

const API_EventReason = z
  .enum([
    "MessageAccepted",
    "MessageSuccessfullyRelayed",
    "MessageRejected",
    "UnknownRecipient",
    "MessageConsignedToRecipient",
    "MessageNotConsignedForQuota",
    "MessageHandoverToRecipient",
    "MessageTypeNotAcceptedByRecipient",
  ])
  .meta({ description: "Reason of an ERDS evidence event", id: "EventReason" });
type API_EventReason = z.infer<typeof API_EventReason>;

// The eventReason is determined by the eventIdentifier (def page constraint).
const erdEventReasons: Record<API_EventIdentifier, API_EventReason> = {
  ContentConsignment: "MessageConsignedToRecipient",
  ContentConsignmentFailure: "MessageNotConsignedForQuota",
  ContentHandover: "MessageHandoverToRecipient",
  ContentHandoverFailure: "MessageTypeNotAcceptedByRecipient",
  RelayAcceptance: "MessageSuccessfullyRelayed",
  RelayFailure: "UnknownRecipient",
  RelayRejection: "MessageRejected",
  SubmissionAcceptance: "MessageAccepted",
};

const API_UserContent = z
  .strictObject({
    body: z.string(),
    subject: z.string(),
  })
  .meta({
    description: "The message the sender wants to deliver to the recipient",
    id: "UserContent",
  });

const API_RelayMetadata = z
  .strictObject({
    messageIdentifier: API_ErdsRefIdentifier,
    messageType: API_ErdMessageType,
    recipientIdentifier: API_ErdsPartyIdentifier,
    senderIdentifier: API_ErdsPartyIdentifier,
    userContentInformation: z.literal("text").optional(),
    version: z.literal("KNODIAUSECASE"),
  })
  .meta({
    description: "Metadata generated by a SERC to relay a data exchange",
    id: "RelayMetadata",
  });

const API_ErdEvidence = z
  .strictObject({
    eventIdentifier: API_EventIdentifier,
    eventReason: API_EventReason,
    eventTime: z.iso.datetime(),
    evidenceIdentifier: API_ErdsRefIdentifier,
    version: z.literal("KNODIAUSECASE"),
  })
  .refine((e) => e.eventReason === erdEventReasons[e.eventIdentifier], {
    error: "eventReason does not match its eventIdentifier",
  })
  .meta({
    description: "ERDS evidence generated by a SERC for a data exchange",
    id: "ErdEvidence",
  });

export const API_ErdDispatch = z
  .strictObject({
    evidence: API_ErdEvidence,
    relayMetadata: API_RelayMetadata,
    userContent: API_UserContent.optional(),
  })
  .meta({
    description:
      "The set of data exchanged between SERCs: the user message (optional), the relay metadata, and the evidence (ETSI EN 319 522-2).",
    id: "ErdDispatch",
  });
export type API_ErdDispatch = z.infer<typeof API_ErdDispatch>;

export const API_RelayAck = z
  .strictObject({
    correlationId: z.uuid(),
    messageIdentifier: API_ErdsRefIdentifier,
    receivedAt: z.iso.datetime(),
  })
  .meta({
    description:
      "Acknowledgment returned by a SERC upon accepting a relayed dispatch.",
    id: "RelayAck",
  });
export type API_RelayAck = z.infer<typeof API_RelayAck>;
