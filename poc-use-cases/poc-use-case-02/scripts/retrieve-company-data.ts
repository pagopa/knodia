// POC UC02 — Phase 3.
//
// Mints an e-service access token for the consumer keychain/purpose, then calls
// the cross-border companies e-service on the producer knode (Lynx) and prints
// the legal entity and its evidences.
//
//   node retrieve-company-data.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>
//
// Run generate-consumer-key first (Phase 2) and upload its public key to the
// consumer keychain, otherwise the access token cannot be minted.

import { parseArgs } from "node:util";

import { assertPrivateKeysExist, mintAccessToken } from "./lib.ts";
import {
  AUTHORIZATION_SERVER_URL,
  CONSUMER_PRIVATE_KEY_PATH,
  MOCK_ESERVICE_URL,
} from "./paths.ts";

const { values } = parseArgs({
  options: {
    "company-id": { type: "string" },
    "consumer-keychain-id": { type: "string" },
    "purpose-id": { type: "string" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const companyId = values["company-id"];

if (!consumerKeychainId || !purposeId || !companyId) {
  console.error(
    "Usage: node retrieve-company-data.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>",
  );
  process.exit(1);
}

assertPrivateKeysExist(CONSUMER_PRIVATE_KEY_PATH);

const accessToken = await mintAccessToken(
  AUTHORIZATION_SERVER_URL,
  consumerKeychainId,
  purposeId,
);

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${MOCK_ESERVICE_URL}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(
      `GET ${path} failed (${response.status}): ${await response.text()}`,
    );
  }
  return response.json();
}

const information = await getJson(`/legal-entities/${companyId}/information`);
const evidences = await getJson(`/legal-entities/${companyId}/evidences`);

console.log("Company information:");
console.log(JSON.stringify(information, null, 2));
console.log("\nEvidences:");
console.log(JSON.stringify(evidences, null, 2));
