// Shared helpers for the POC UC02 Signal Hub demo scripts (Phase 4).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  CONSUMER_KNODE_API_PRIVATE_KEY_PATH,
  CONSUMER_PRIVATE_KEY_PATH,
  MOCK_ESERVICE_URL,
  PRODUCER_KNODE_API_PRIVATE_KEY_PATH,
  REPO_ROOT,
} from "./paths.ts";

const CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

// Matches the mock e-service's object_id scheme so producer and consumer derive
// the same id for a company's evidence.
export function objectIdForCompany(companyId: string, seed: string): string {
  return createHash("sha256").update(companyId + seed).digest("hex");
}

const KEY_GENERATOR: Record<string, string> = {
  [CONSUMER_PRIVATE_KEY_PATH]: "generate-consumer-key",
  [PRODUCER_KNODE_API_PRIVATE_KEY_PATH]: "generate-knode-api-key",
  [CONSUMER_KNODE_API_PRIVATE_KEY_PATH]: "generate-knode-api-key",
};

export function assertPrivateKeysExist(...keyPaths: string[]): void {
  for (const keyPath of keyPaths) {
    if (!existsSync(keyPath)) {
      console.error(
        `Private key not found at ${keyPath}. Run ${KEY_GENERATOR[keyPath]} first.`,
      );
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
  privateKeyPath: string,
): Promise<string> {
  const assertion = signClientAssertion(
    privateKeyPath,
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

// Marks the company's evidence as changed on the mock e-service (out-of-spec
// route, gated by the producer's Knode API token) so the recover step sees an
// update. Returns the new evidence revision.
export async function triggerEvidenceUpdate(
  companyId: string,
  knodeApiToken: string,
): Promise<number> {
  const response = await fetch(
    `${MOCK_ESERVICE_URL}/legal-entities/${companyId}/evidence-update`,
    {
      headers: { authorization: `Bearer ${knodeApiToken}` },
      method: "POST",
    },
  );
  if (!response.ok) {
    console.error(
      `Evidence update failed (${response.status}): ${await response.text()}`,
    );
    process.exit(1);
  }
  return ((await response.json()) as { evidenceRevision: number })
    .evidenceRevision;
}

// GET a JSON resource from the mock e-service with a bearer access token.
export async function getMockJson(
  path: string,
  accessToken: string,
): Promise<unknown> {
  const response = await fetch(`${MOCK_ESERVICE_URL}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error(
      `GET ${path} failed (${response.status}): ${await response.text()}`,
    );
    process.exit(1);
  }
  return response.json();
}

export async function getPseudonymizationSeed(
  accessToken: string,
): Promise<string> {
  const body = (await getMockJson(
    "/legal-entities/pseudonymization",
    accessToken,
  )) as { seed: string };
  return body.seed;
}
