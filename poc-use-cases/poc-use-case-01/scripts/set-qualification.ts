// POC UC01 — Phase 4 (OBJECTIVE_02).
//
// Mints an e-service access token for the consumer keychain/purpose of the
// receive-data setQualification e-service, registers a new qualification for the
// student on the producer knode (Lynx) and prints the acknowledgement. A later
// retrieve-qualifications reflects the new record.
//
//   node set-qualification.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --student-id <uid> \
//     [--title <text>] [--eqf-level <levelNN>] [--iscedf-code <code>] \
//     [--publisher-legal-name <text>]
//
// Use the agreement/purpose/keychain of the receive-data e-service (distinct
// from the provide-data one).

import { parseArgs } from "node:util";

import { mintEserviceAccessToken } from "./accessToken.ts";
import { MOCK_ESERVICE_URL } from "./paths.ts";

const { values } = parseArgs({
  options: {
    "consumer-keychain-id": { type: "string" },
    "eqf-level": { type: "string", default: "level06" },
    "iscedf-code": { type: "string", default: "06" },
    "publisher-legal-name": { type: "string", default: "Academy Orion" },
    "purpose-id": { type: "string" },
    "student-id": { type: "string" },
    title: { type: "string", default: "bachelor degree in computer science" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const studentId = values["student-id"];

if (!consumerKeychainId || !purposeId || !studentId) {
  console.error(
    "Usage: node set-qualification.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --student-id <uid> [--title <text>] [--eqf-level <levelNN>] [--iscedf-code <code>] [--publisher-legal-name <text>]",
  );
  process.exit(1);
}

const qualification = {
  EQFLevel: values["eqf-level"],
  ISCEDFCode: [values["iscedf-code"]],
  publisher: {
    legalName: values["publisher-legal-name"],
    location: {
      geographicIdentifier: "https://www.geonames.org/3165456",
      geographicName: "Torre del Greco",
    },
  },
  title: values.title,
};

let accessToken: string;
try {
  accessToken = await mintEserviceAccessToken(consumerKeychainId, purposeId);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const response = await fetch(
  `${MOCK_ESERVICE_URL}/students/${studentId}/qualifications`,
  {
    body: JSON.stringify(qualification),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    method: "POST",
  },
);

if (!response.ok) {
  console.error(
    `setQualification failed (${response.status}): ${await response.text()}`,
  );
  process.exit(1);
}

console.log(`Registered a new qualification for student ${studentId}:`);
console.log(JSON.stringify(qualification, null, 2));
console.log("\nAcknowledgement:");
console.log(JSON.stringify(await response.json(), null, 2));
