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
  assertOk,
  assertPrivateKeysExist,
  getMockJson,
  getPseudonymizationSeed,
  mintAccessToken,
  mintKnodeApiToken,
  objectIdForCompany,
} from "./lib.ts";
import {
  AUTHORIZATION_SERVER_URL,
  COMPANIES_ESERVICE_ID,
  CONSUMER_KNODE_API_PRIVATE_KEY_PATH,
  CONSUMER_PRIVATE_KEY_PATH,
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

assertPrivateKeysExist(
  CONSUMER_PRIVATE_KEY_PATH,
  CONSUMER_KNODE_API_PRIVATE_KEY_PATH,
);

// Minted at the target Signal Hub's knode (Lynx) so the token is one that hub
// trusts; knodeId "Orion" tells Lynx to resolve the keychain from Orion.
const knodeApiToken = await mintKnodeApiToken(
  AUTHORIZATION_SERVER_URL,
  consumerKnodeApiKeychainId,
  "Orion",
  CONSUMER_KNODE_API_PRIVATE_KEY_PATH,
);

// Page through all signals (cursor = last id of each page) so the latest update
// is found regardless of count.
const PAGE_SIZE = 100;
const signals: Signal[] = [];
let cursor = 0;
for (;;) {
  const pullResponse = await fetch(
    `${SIGNAL_HUB_URL}/signals/${COMPANIES_ESERVICE_ID}?lastSignalId=${cursor}&size=${PAGE_SIZE}`,
    { headers: { authorization: `Bearer ${knodeApiToken}` } },
  );
  await assertOk(pullResponse, "Signal pull");
  const page = ((await pullResponse.json()) as { signals: Signal[] }).signals;
  signals.push(...page);
  const last = page.at(-1);
  if (!last || page.length < PAGE_SIZE) break;
  cursor = last.signalId;
}

const accessToken = await mintAccessToken(
  AUTHORIZATION_SERVER_URL,
  consumerKeychainId,
  purposeId,
);
const seed = await getPseudonymizationSeed(accessToken);
const objectId = objectIdForCompany(companyId, seed);

// Signals are pulled ascending, so the last matching UPDATE is the latest one.
const matchingSignal = signals.findLast(
  (signal) => signal.objectId === objectId && signal.signalType === "UPDATE",
);

if (!matchingSignal) {
  console.log(
    `No evidence-change signal found for company ${companyId} (object_id ${objectId}).`,
  );
  process.exit(0);
}

const evidences = await getMockJson(
  `/legal-entities/${companyId}/evidences`,
  accessToken,
);

console.log("Matched evidence-change signal:");
console.log(JSON.stringify(matchingSignal, null, 2));
console.log("\nUpdated evidences:");
console.log(JSON.stringify(evidences, null, 2));
