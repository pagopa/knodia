// POC UC02 — Phase 3.
//
// Wraps scripts/local-auth/generate-client-assertion.ts to mint an e-service
// access token for the consumer keychain/purpose, then calls the cross-border
// companies e-service on the producer knode (Lynx) and prints the legal entity
// and its evidences.
//
//   node retrieve-company-data.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> --company-id <vat>
//
// Run generate-key first (Phase 2) and upload its public key to the consumer
// keychain, otherwise the access token cannot be minted.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import {
  AUTHORIZATION_SERVER_URL,
  CONSUMER_PRIVATE_KEY_PATH,
  MOCK_ESERVICE_URL,
  REPO_ROOT,
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

if (!existsSync(CONSUMER_PRIVATE_KEY_PATH)) {
  console.error(
    `Private key not found at ${CONSUMER_PRIVATE_KEY_PATH}. Run generate-key first.`,
  );
  process.exit(1);
}

const assertion = spawnSync(
  "node",
  [
    resolve(REPO_ROOT, "scripts/local-auth/generate-client-assertion.ts"),
    "--key",
    CONSUMER_PRIVATE_KEY_PATH,
    "--keychainId",
    consumerKeychainId,
    "--purposeId",
    purposeId,
  ],
  { encoding: "utf-8" },
);

if (assertion.status !== 0) {
  console.error(assertion.stderr || assertion.stdout);
  process.exit(1);
}

const clientAssertion = assertion.stdout.trim();

const tokenResponse = await fetch(`${AUTHORIZATION_SERVER_URL}/token`, {
  body: new URLSearchParams({
    client_assertion: clientAssertion,
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_id: consumerKeychainId,
    grant_type: "client_credentials",
  }),
  method: "POST",
});

if (!tokenResponse.ok) {
  console.error(
    `Access token request failed (${tokenResponse.status}): ${await tokenResponse.text()}`,
  );
  process.exit(1);
}

const { access_token: accessToken } = (await tokenResponse.json()) as {
  access_token: string;
};

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${MOCK_ESERVICE_URL}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

const information = await getJson(`/legal-entities/${companyId}/information`);
const evidences = await getJson(`/legal-entities/${companyId}/evidences`);

console.log("Company information:");
console.log(JSON.stringify(information, null, 2));
console.log("\nEvidences:");
console.log(JSON.stringify(evidences, null, 2));
