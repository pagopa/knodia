// POC UC01 — Phase 3 (OBJECTIVE_01).
//
// Mints an e-service access token for the consumer keychain/purpose of the
// provide-data getQualifications e-service, calls it on the producer knode
// (Lynx) and prints the student's qualifications.
//
//   node retrieve-qualifications.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --student-id <uid> [--iscedf-code <code>]
//
// Run generate-key first (Phase 2) and upload its public key to the consumer
// keychain, otherwise the access token cannot be minted.

import { parseArgs } from "node:util";

import { getJson } from "../../_shared/eservice-client.ts";
import { mintEserviceAccessToken } from "./accessToken.ts";
import { MOCK_ESERVICE_URL } from "./paths.ts";

const { values } = parseArgs({
  options: {
    "consumer-keychain-id": { type: "string" },
    "iscedf-code": { type: "string" },
    "purpose-id": { type: "string" },
    "student-id": { type: "string" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const studentId = values["student-id"];
const iscedfCode = values["iscedf-code"];

if (!consumerKeychainId || !purposeId || !studentId) {
  console.error(
    "Usage: node retrieve-qualifications.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --student-id <uid> [--iscedf-code <code>]",
  );
  process.exit(1);
}

const query = iscedfCode
  ? `?${new URLSearchParams({ iscedfCode }).toString()}`
  : "";

let qualifications: unknown;
try {
  const accessToken = await mintEserviceAccessToken(consumerKeychainId, purposeId);
  qualifications = await getJson(
    MOCK_ESERVICE_URL,
    `/students/${studentId}/qualifications${query}`,
    accessToken,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log(`Qualifications for student ${studentId}:`);
console.log(JSON.stringify(qualifications, null, 2));
