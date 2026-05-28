import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import z from "zod";

import {
  API_Address,
  API_ContactPoint,
  type API_DigitalContact,
  API_NaturalPerson,
  API_Notation,
  type API_PersonalInformation,
  type API_Residence,
} from "../models/api.ts";
import {
  computePeriodId,
  type SignalHubSeedConfig,
} from "../signalHub/rotation.ts";
import { rotatingAddresses } from "./rotatingAddresses.ts";

const CODICE_FISCALE_SCHEME = {
  schemeName: "Codice Fiscale",
  schemeURI: "http://memberstate.ms/PIdentifier",
} as const;

const NaturalPersonRow = API_NaturalPerson.omit({ identifier: true });

const NaturalPersonsFile = z.record(API_Notation, NaturalPersonRow);
const ContactPointsFile = z.record(API_Notation, API_ContactPoint);
const AddressesFile = z.record(API_Notation, API_Address);

const dataDir = dirname(fileURLToPath(import.meta.url));
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));

const NATURAL_PERSONS = readJson("naturalPersons.json", NaturalPersonsFile);
const CONTACT_POINTS = readJson("contactPoints.json", ContactPointsFile);
const ADDRESSES = readJson("addresses.json", AddressesFile);

// Distinguishes a genuinely unknown person from a known person whose residence
// is absent this period (the rotating "deleted" slot) — they must surface as
// different 404s instead of both reading as "natural person not found".
export type FindResidenceResult =
  | { kind: "found"; residence: API_Residence }
  | { kind: "personNotFound" }
  | { kind: "residenceUnavailable" };

export function findDigitalContact(
  notation: API_Notation,
): API_DigitalContact | undefined {
  const naturalPerson = findNaturalPersonWithIdentifier(notation);
  const contactPoint = CONTACT_POINTS[notation];
  if (!naturalPerson || !contactPoint) {
    return undefined;
  }
  return { contactPoint, naturalPerson };
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

export function findResidence(
  notation: API_Notation,
  now: number,
  config: SignalHubSeedConfig,
): FindResidenceResult {
  const naturalPerson = findNaturalPersonWithIdentifier(notation);
  if (!naturalPerson) {
    return { kind: "personNotFound" };
  }

  const cycle = rotatingAddresses[notation];
  if (cycle) {
    const periodId = computePeriodId(now, config);
    const address = cycle.at(periodId % cycle.length);
    if (!address) {
      return { kind: "residenceUnavailable" };
    }
    return { kind: "found", residence: { address, naturalPerson } };
  }

  const address = ADDRESSES[notation];
  if (!address) {
    return { kind: "residenceUnavailable" };
  }
  return { kind: "found", residence: { address, naturalPerson } };
}

function findNaturalPersonWithIdentifier(
  notation: API_Notation,
): API_NaturalPerson | undefined {
  const person = NATURAL_PERSONS[notation];
  if (!person) {
    return undefined;
  }
  return { ...person, identifier: { ...CODICE_FISCALE_SCHEME, notation } };
}
