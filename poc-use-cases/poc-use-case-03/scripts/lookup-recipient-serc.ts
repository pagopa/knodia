// POC UC03 — Phase 5, step 2.
//
// Mints an e-service access token for systemSERCLynx's keychain/purpose on the
// supervisoryBodyOrion provide-data e-service, then calls lookupERDS and
// getERDSMetadata to discover which SERC serves the recipient and its relay URL.
//
//   node lookup-recipient-serc.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --recipient-id 01229430085
//
// Run generate-lynx-key first (Phase 2) and upload its public key to the
// consumer keychain, otherwise the access token cannot be minted.

import { parseArgs } from "node:util";

import { getJson, mintAccessToken, requirePrivateKey } from "./lib.ts";
import {
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  ORION_AUTHORIZATION_SERVER_URL,
  SUPERVISORY_BODY_MOCK_URL,
} from "./paths.ts";

const { values } = parseArgs({
  options: {
    "consumer-keychain-id": { type: "string" },
    "purpose-id": { type: "string" },
    "recipient-id": { type: "string" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const recipientId = values["recipient-id"];

if (!consumerKeychainId || !purposeId || !recipientId) {
  console.error(
    "Usage: node lookup-recipient-serc.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --recipient-id <notation>",
  );
  process.exit(1);
}

requirePrivateKey(
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  "Run generate-lynx-key first and upload its public key to the keychain.",
);

const accessToken = await mintAccessToken(
  ORION_AUTHORIZATION_SERVER_URL,
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  consumerKeychainId,
  purposeId,
);

const { erdsIdentifier } = (await getJson(
  SUPERVISORY_BODY_MOCK_URL,
  `/erds?identifier=${encodeURIComponent(recipientId)}`,
  accessToken,
)) as { erdsIdentifier: string };

const metadata = (await getJson(
  SUPERVISORY_BODY_MOCK_URL,
  `/erds/${encodeURIComponent(erdsIdentifier)}/metadata`,
  accessToken,
)) as { domainName: string; eserviceId: string; knodeId: string };

console.log(`Recipient ${recipientId} is served by ${erdsIdentifier}.`);
console.log(`Relay URL (pass as --relay-url): ${metadata.domainName}`);
console.log("\nERDS metadata:");
console.log(JSON.stringify({ identifier: erdsIdentifier, ...metadata }, null, 2));
