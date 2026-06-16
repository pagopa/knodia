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

import {
  assertPrivateKeysExist,
  getMockJson,
  mintAccessToken,
} from "./lib.ts";
import { AUTHORIZATION_SERVER_URL, CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

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

const information = await getMockJson(
  `/legal-entities/${companyId}/information`,
  accessToken,
);
const evidences = await getMockJson(
  `/legal-entities/${companyId}/evidences`,
  accessToken,
);

console.log("Company information:");
console.log(JSON.stringify(information, null, 2));
console.log("\nEvidences:");
console.log(JSON.stringify(evidences, null, 2));
