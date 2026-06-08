// Shared helpers for the POC UC02 Signal Hub demo scripts (Phase 4).
//
// Two keypairs are used: the consumer e-service keychain key signs access-token
// assertions, and the Knode API keychain key signs knode-api-token assertions
// (see paths.ts for why they must differ).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  CONSUMER_PRIVATE_KEY_PATH,
  KNODE_API_PRIVATE_KEY_PATH,
  MOCK_ESERVICE_URL,
  REPO_ROOT,
} from "./paths.ts";

const CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

// Must match the mock e-service's object_id scheme so producer and consumer
// derive the same id for a company's evidence.
export function objectIdForCompany(companyId: string, seed: string): string {
  return createHash("sha256").update(companyId + seed).digest("hex");
}

export function assertPrivateKeysExist(): void {
  for (const keyPath of [
    CONSUMER_PRIVATE_KEY_PATH,
    KNODE_API_PRIVATE_KEY_PATH,
  ]) {
    if (!existsSync(keyPath)) {
      console.error(`Private key not found at ${keyPath}. Run generate-key first.`);
      process.exit(1);
    }
  }
}

function signClientAssertion(
  keyPath: string,
  extraArgs: string[],
  keychainId: string,
): string {
  const result = spawnSync(
    "node",
    [
      resolve(REPO_ROOT, "scripts/local-auth/generate-client-assertion.ts"),
      "--key",
      keyPath,
      "--keychainId",
      keychainId,
      ...extraArgs,
    ],
    { encoding: "utf-8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  return result.stdout.trim();
}

async function requestToken(
  authorizationServerUrl: string,
  path: string,
  clientAssertion: string,
  clientId: string,
): Promise<string> {
  const response = await fetch(`${authorizationServerUrl}${path}`, {
    body: new URLSearchParams({
      client_assertion: clientAssertion,
      client_assertion_type: CLIENT_ASSERTION_TYPE,
      client_id: clientId,
      grant_type: "client_credentials",
    }),
    method: "POST",
  });
  if (!response.ok) {
    console.error(
      `Token request to ${path} failed (${response.status}): ${await response.text()}`,
    );
    process.exit(1);
  }
  return ((await response.json()) as { access_token: string }).access_token;
}

export function mintAccessToken(
  authorizationServerUrl: string,
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  const assertion = signClientAssertion(
    CONSUMER_PRIVATE_KEY_PATH,
    ["--purposeId", purposeId],
    consumerKeychainId,
  );
  return requestToken(
    authorizationServerUrl,
    "/token",
    assertion,
    consumerKeychainId,
  );
}

export function mintKnodeApiToken(
  authorizationServerUrl: string,
  knodeApiKeychainId: string,
  knodeId: string,
): Promise<string> {
  const assertion = signClientAssertion(
    KNODE_API_PRIVATE_KEY_PATH,
    ["--knodeId", knodeId],
    knodeApiKeychainId,
  );
  return requestToken(
    authorizationServerUrl,
    "/knodeApiToken",
    assertion,
    knodeApiKeychainId,
  );
}

export async function getPseudonymizationSeed(
  accessToken: string,
): Promise<string> {
  const response = await fetch(
    `${MOCK_ESERVICE_URL}/legal-entities/pseudonymization`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    console.error(
      `Pseudonymization request failed (${response.status}): ${await response.text()}`,
    );
    process.exit(1);
  }
  return ((await response.json()) as { seed: string }).seed;
}
