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
      "Personal information returned by the Cross-Border E-Service 01",
    id: "PersonalInformation",
  });
export type API_PersonalInformation = z.infer<typeof API_PersonalInformation>;

export const API_DigitalContact = z
  .strictObject({
    contactPoint: API_ContactPoint,
    naturalPerson: API_NaturalPerson,
  })
  .meta({
    description: "Digital contact returned by the Cross-Border E-Service 02",
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
    description: "Residence returned by the Cross-Border E-Service 03",
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
      "Pseudonymization parameters used by the Producer to publish Signal Hub signals for the residence addresses managed by this e-service",
    id: "Pseudonymization",
  });
export type API_Pseudonymization = z.infer<typeof API_Pseudonymization>;
