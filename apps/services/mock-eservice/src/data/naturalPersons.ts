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

const CODICE_FISCALE_SCHEME = {
  schemeName: "Codice Fiscale",
  schemeURI: "http://memberstate.ms/PIdentifier",
} as const;

const NaturalPersonRow = API_NaturalPerson.omit({ identifier: true });

const NaturalPersonsFile = z.record(API_Notation, NaturalPersonRow);
const ContactPointsFile = z.record(API_Notation, API_ContactPoint);
const AddressesFile = z.record(API_Notation, API_Address);
const RotatingAddressesFile = z.record(
  API_Notation,
  z.tuple([API_Address, API_Address, z.null()]),
);

const dataDir = dirname(fileURLToPath(import.meta.url));
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(join(dataDir, file), "utf8")));

const NATURAL_PERSONS = readJson("naturalPersons.json", NaturalPersonsFile);
const CONTACT_POINTS = readJson("contactPoints.json", ContactPointsFile);
const ADDRESSES = readJson("addresses.json", AddressesFile);
const ROTATING_ADDRESSES = readJson(
  "rotatingAddresses.json",
  RotatingAddressesFile,
);

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

// Returns the residence of a natural person.
// For codici fiscali in the rotating subset, the response cycles per
// `periodId % 3`: index 0 = address A (CREATE phase), 1 = address B (UPDATE),
// 2 = null (DELETE → undefined → 404). KN-547 will publish matching
// CREATE/UPDATE/DELETE signals each period.
export function findResidence(
  notation: API_Notation,
  periodId: number,
): API_Residence | undefined {
  const person = NATURAL_PERSONS[notation];
  if (!person) {
    return undefined;
  }
  const naturalPerson = {
    ...person,
    identifier: { ...CODICE_FISCALE_SCHEME, notation },
  };

  const cycle = ROTATING_ADDRESSES[notation];
  if (cycle) {
    const cycleIndex =
      ((periodId % cycle.length) + cycle.length) % cycle.length;
    const rotatedAddress = cycle.at(cycleIndex);
    if (!rotatedAddress) {
      return undefined;
    }
    return { address: rotatedAddress, naturalPerson };
  }

  const address = ADDRESSES[notation];
  if (!address) {
    return undefined;
  }
  return { address, naturalPerson };
}
