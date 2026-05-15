import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "zod";

import {
  API_ContactPoint,
  type API_DigitalContact,
  API_NaturalPerson,
  API_Notation,
  type API_PersonalInformation,
} from "../models/api.ts";

const CODICE_FISCALE_SCHEME = {
  schemeName: "Codice Fiscale",
  schemeURI: "http://memberstate.ms/PIdentifier",
} as const;

const NaturalPersonRow = API_NaturalPerson.omit({ identifier: true });

const NaturalPersonsFile = z.record(API_Notation, NaturalPersonRow);
const ContactPointsFile = z.record(API_Notation, API_ContactPoint);

const dataDir = dirname(fileURLToPath(import.meta.url));
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));

const NATURAL_PERSONS = readJson("naturalPersons.json", NaturalPersonsFile);
const CONTACT_POINTS = readJson("contactPoints.json", ContactPointsFile);

export function findDigitalContact(
  notation: API_Notation,
): API_DigitalContact | undefined {
  const person = NATURAL_PERSONS[notation];
  const contact = CONTACT_POINTS[notation];
  if (!person || !contact) {
    return undefined;
  }
  return {
    contactPoint: contact,
    naturalPerson: {
      ...person,
      identifier: { ...CODICE_FISCALE_SCHEME, notation },
    },
  };
}

export function findPersonalInformation(
  notation: API_Notation,
): API_PersonalInformation | undefined {
  const person = NATURAL_PERSONS[notation];
  if (!person) {
    return undefined;
  }
  return { dateOfBirth: person.dateOfBirth };
}
