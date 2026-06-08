// POC UC02 — Phase 4 (producer side).
//
// Publishes a Signal Hub UPDATE signal for a company's evidence on the producer
// knode (Lynx). The mock e-service does not auto-emit; this is the manual push.
//
//   node publish-evidence-update-signal.ts \
//     --producer-knode-api-keychain-id <uuid> \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>
//
// The consumer keychain/purpose are needed only to read the e-service's
// pseudonymization seed (access-token protected), which both producer and
// consumer use to derive the same object_id = sha256(uid_company + seed).

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
  SIGNAL_HUB_URL,
} from "./paths.ts";

const OBJECT_TYPE = "legal-entities/evidence";

const { values } = parseArgs({
  options: {
    "company-id": { type: "string" },
    "consumer-keychain-id": { type: "string" },
    "producer-knode-api-keychain-id": { type: "string" },
    "purpose-id": { type: "string" },
  },
  strict: true,
});

const producerKnodeApiKeychainId = values["producer-knode-api-keychain-id"];
const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const companyId = values["company-id"];

if (
  !producerKnodeApiKeychainId ||
  !consumerKeychainId ||
  !purposeId ||
  !companyId
) {
  console.error(
    "Usage: node publish-evidence-update-signal.ts --producer-knode-api-keychain-id <uuid> --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>",
  );
  process.exit(1);
}

assertPrivateKeysExist();

const accessToken = await mintAccessToken(
  AUTHORIZATION_SERVER_URL,
  consumerKeychainId,
  purposeId,
);
const seed = await getPseudonymizationSeed(accessToken);
const objectId = objectIdForCompany(companyId, seed);

const knodeApiToken = await mintKnodeApiToken(
  AUTHORIZATION_SERVER_URL,
  producerKnodeApiKeychainId,
  "Lynx",
);

// Signal ids must be strictly increasing per e-service; seconds-since-epoch is
// monotonic across manual runs and stays well above any seeded value.
async function pushSignal(signalId: number): Promise<Response> {
  return fetch(`${SIGNAL_HUB_URL}/signals`, {
    body: JSON.stringify({
      eserviceId: COMPANIES_ESERVICE_ID,
      objectId,
      objectType: OBJECT_TYPE,
      signalId,
      signalType: "UPDATE",
    }),
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

console.log("Published evidence-update signal:");
console.log(
  JSON.stringify(
    {
      eserviceId: COMPANIES_ESERVICE_ID,
      objectId,
      objectType: OBJECT_TYPE,
      signalId,
      signalType: "UPDATE",
    },
    null,
    2,
  ),
);
