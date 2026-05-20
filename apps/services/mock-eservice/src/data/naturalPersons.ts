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
import { rotatingFiscalCodes } from "../signalHub/mockup.ts";
import {
  computePeriodId,
  type SignalHubSeedConfig,
} from "../signalHub/rotation.ts";

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
  z.array(API_Address.nullable()).min(1),
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

// Drift guard: the in-process emitter writes signals for the fiscal codes in
// `rotatingFiscalCodes`; mock-eservice rotates `/residence` for the keys of
// `rotatingAddresses.json`. If these diverge, a consumer can't correlate
// signals back to producer data. Called from `buildApp` so it fails loud at
// boot but doesn't fire on every import (e.g. unrelated test files).
export function assertRotatingFiscalCodesAreInSync(): void {
  const expected = [...rotatingFiscalCodes].sort();
  const actual = Object.keys(ROTATING_ADDRESSES).sort();
  if (
    expected.length !== actual.length ||
    expected.some((fc, i) => fc !== actual[i])
  ) {
    throw new Error(
      `rotatingAddresses.json keys diverge from signalHub/mockup rotatingFiscalCodes. ` +
        `expected: [${expected.join(", ")}]; actual: [${actual.join(", ")}]`,
    );
  }
}

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

// Returns the residence of a natural person. For codici fiscali in the
// rotating subset, the cycle index = `periodId % cycle.length`: index 0 =
// address A (CREATE phase), 1 = address B (UPDATE phase), 2 = null
// (DELETE phase → undefined → 404). The in-process Signal Hub emitter
// publishes the matching CREATE/UPDATE/DELETE signals each period.
export function findResidence(
  notation: API_Notation,
  now: number,
  config: SignalHubSeedConfig,
): API_Residence | undefined {
  const naturalPerson = findNaturalPersonWithIdentifier(notation);
  if (!naturalPerson) {
    return undefined;
  }

  const cycle = ROTATING_ADDRESSES[notation];
  if (cycle) {
    const periodId = computePeriodId(now, config);
    const address = cycle.at(periodId % cycle.length);
    if (!address) {
      return undefined;
    }
    return { address, naturalPerson };
  }

  const address = ADDRESSES[notation];
  if (!address) {
    return undefined;
  }
  return { address, naturalPerson };
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
