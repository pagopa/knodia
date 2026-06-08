// POC UC02 — Phase 4 (consumer side).
//
// Pulls Signal Hub signals for the companies e-service from the producer knode
// (Lynx), checks whether the monitored company's evidence changed, and if so
// re-fetches and prints the updated evidences.
//
//   node recover-evidence-changes.ts \
//     --consumer-knode-api-keychain-id <uuid> \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>

import { parseArgs } from "node:util";

import {
  assertPrivateKeysExist,
  getPseudonymizationSeed,
  mintAccessToken,
  mintKnodeApiToken,
  objectIdForCompany,
} from "./lib.ts";
import {
  AUTHORIZATION_SERVER_URL,
  COMPANIES_ESERVICE_ID,
  CONSUMER_AUTHORIZATION_SERVER_URL,
  MOCK_ESERVICE_URL,
  SIGNAL_HUB_URL,
} from "./paths.ts";

interface Signal {
  objectId?: string;
  objectType?: string;
  signalId: number;
  signalType: string;
}

const { values } = parseArgs({
  options: {
    "company-id": { type: "string" },
    "consumer-keychain-id": { type: "string" },
    "consumer-knode-api-keychain-id": { type: "string" },
    "purpose-id": { type: "string" },
  },
  strict: true,
});

const consumerKnodeApiKeychainId = values["consumer-knode-api-keychain-id"];
const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const companyId = values["company-id"];

if (
  !consumerKnodeApiKeychainId ||
  !consumerKeychainId ||
  !purposeId ||
  !companyId
) {
  console.error(
    "Usage: node recover-evidence-changes.ts --consumer-knode-api-keychain-id <uuid> --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>",
  );
  process.exit(1);
}

assertPrivateKeysExist();

const knodeApiToken = await mintKnodeApiToken(
  CONSUMER_AUTHORIZATION_SERVER_URL,
  consumerKnodeApiKeychainId,
  "Orion",
);

const pullResponse = await fetch(
  `${SIGNAL_HUB_URL}/signals/${COMPANIES_ESERVICE_ID}?lastSignalId=0&size=100`,
  { headers: { authorization: `Bearer ${knodeApiToken}` } },
);
if (!pullResponse.ok) {
  console.error(
    `Signal pull failed (${pullResponse.status}): ${await pullResponse.text()}`,
  );
  process.exit(1);
}
const { signals } = (await pullResponse.json()) as { signals: Signal[] };

const accessToken = await mintAccessToken(
  AUTHORIZATION_SERVER_URL,
  consumerKeychainId,
  purposeId,
);
const seed = await getPseudonymizationSeed(accessToken);
const objectId = objectIdForCompany(companyId, seed);

const matchingSignal = signals.find((signal) => signal.objectId === objectId);

if (!matchingSignal) {
  console.log(
    `No evidence-change signal found for company ${companyId} (object_id ${objectId}).`,
  );
  process.exit(0);
}

const evidencesResponse = await fetch(
  `${MOCK_ESERVICE_URL}/legal-entities/${companyId}/evidences`,
  { headers: { authorization: `Bearer ${accessToken}` } },
);
if (!evidencesResponse.ok) {
  console.error(
    `Evidences request failed (${evidencesResponse.status}): ${await evidencesResponse.text()}`,
  );
  process.exit(1);
}

console.log("Matched evidence-change signal:");
console.log(JSON.stringify(matchingSignal, null, 2));
console.log("\nUpdated evidences:");
console.log(JSON.stringify(await evidencesResponse.json(), null, 2));
