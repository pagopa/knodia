// POC UC02 — Phase 4 (producer side).
//
// Publishes a Signal Hub UPDATE signal for a company's evidence on the producer
// knode (Lynx). The mock e-service does not auto-emit; this is the manual push.
//
//   node publish-evidence-update-signal.ts \
//     --producer-knode-api-keychain-id <uuid> --company-id <vat>

import { parseArgs } from "node:util";

import {
  assertPrivateKeysExist,
  mintKnodeApiToken,
  objectIdForCompany,
  triggerEvidenceUpdate,
} from "./lib.ts";
import {
  AUTHORIZATION_SERVER_URL,
  COMPANIES_ESERVICE_ID,
  PRODUCER_KNODE_API_PRIVATE_KEY_PATH,
  SIGNAL_HUB_URL,
} from "./paths.ts";

const OBJECT_TYPE = "legal-entities/evidence";

const { values } = parseArgs({
  options: {
    "company-id": { type: "string" },
    "producer-knode-api-keychain-id": { type: "string" },
  },
  strict: true,
});

const producerKnodeApiKeychainId = values["producer-knode-api-keychain-id"];
const companyId = values["company-id"];

if (!producerKnodeApiKeychainId || !companyId) {
  console.error(
    "Usage: node publish-evidence-update-signal.ts --producer-knode-api-keychain-id <uuid> --company-id <vat>",
  );
  process.exit(1);
}

assertPrivateKeysExist(PRODUCER_KNODE_API_PRIVATE_KEY_PATH);

// The producer owns the pseudonymization seed, so it knows it directly instead of
// reading the consumer-facing endpoint. Must match the mock e-service's static
// seed (apps/services/mock-eservice/src/routers/mockPocUc02CompaniesRouter.ts);
// the consumer reads the same value from /legal-entities/pseudonymization.
const PSEUDONYMIZATION_SEED = "0123456789abcdef";
const objectId = objectIdForCompany(companyId, PSEUDONYMIZATION_SEED);

const knodeApiToken = await mintKnodeApiToken(
  AUTHORIZATION_SERVER_URL,
  producerKnodeApiKeychainId,
  "Lynx",
  PRODUCER_KNODE_API_PRIVATE_KEY_PATH,
);

// Change the evidence before announcing it, so recover sees the new value.
const evidenceRevision = await triggerEvidenceUpdate(companyId, knodeApiToken);

function buildSignal(signalId: number) {
  return {
    eserviceId: COMPANIES_ESERVICE_ID,
    objectId,
    objectType: OBJECT_TYPE,
    signalId,
    signalType: "UPDATE",
  };
}

async function pushSignal(signalId: number): Promise<Response> {
  return fetch(`${SIGNAL_HUB_URL}/signals`, {
    body: JSON.stringify(buildSignal(signalId)),
    headers: {
      authorization: `Bearer ${knodeApiToken}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
}

// Signal ids are strictly consecutive per e-service. Start at 1 and walk up to
// the next free id, following whichever id the hub reports as already used or
// expected next.
let signalId = 1;
for (let attempt = 0; ; attempt++) {
  const response = await pushSignal(signalId);
  if (response.ok) {
    break;
  }
  const body = await response.text();
  const alreadyExists = /id (\d+) already exists/.exec(body)?.[1];
  const expected = /expected (\d+)/.exec(body)?.[1];
  if (response.status === 400 && alreadyExists) {
    signalId = Number(alreadyExists) + 1;
  } else if (response.status === 400 && expected) {
    signalId = Number(expected);
  } else {
    console.error(`Signal publication failed (${response.status}): ${body}`);
    process.exit(1);
  }
  if (attempt >= 100) {
    console.error("Could not find a free signal id after 100 attempts.");
    process.exit(1);
  }
}

console.log(`Updated evidence for ${companyId} (revision ${evidenceRevision}).`);
console.log("Published evidence-update signal:");
console.log(JSON.stringify(buildSignal(signalId), null, 2));
