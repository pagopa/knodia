// POC UC03 — Phase 5, step 2.
//
// Mints an e-service access token for systemSERCLynx's keychain/purpose on the
// supervisoryBodyOrion provide-data e-service, then calls lookupERDS and
// getERDSMetadata to discover which SERC (and knode/e-service) serves the recipient.
//
//   node lookup-recipient-serc.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --recipient-id 01229430085
//
// Run generate-lynx-key first (Phase 2) and upload its public key to the
// consumer keychain, otherwise the access token cannot be minted.

import { parseArgs } from "node:util";

import { getJson } from "../../_shared/eservice-client.ts";
import { mintLynxConsumerToken } from "./accessToken.ts";
import { RECIPIENT_SCHEME, SUPERVISORY_BODY_MOCK_URL } from "./paths.ts";

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

const lookupQuery = new URLSearchParams({
  notation: recipientId,
  schemeName: RECIPIENT_SCHEME.schemeName,
  schemeURI: RECIPIENT_SCHEME.schemeURI,
});

let erdsIdentifier: string;
let metadata: unknown;
try {
  const accessToken = await mintLynxConsumerToken(consumerKeychainId, purposeId);
  ({ erdsIdentifier } = (await getJson(
    SUPERVISORY_BODY_MOCK_URL,
    `/erds?${lookupQuery.toString()}`,
    accessToken,
  )) as { erdsIdentifier: string });
  metadata = await getJson(
    SUPERVISORY_BODY_MOCK_URL,
    `/erds/${encodeURIComponent(erdsIdentifier)}/metadata`,
    accessToken,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log(
  `Recipient ${recipientId} is served by ${erdsIdentifier} (pass as --recipient-serc).`,
);
console.log("\nERDS metadata:");
console.log(JSON.stringify(metadata, null, 2));
