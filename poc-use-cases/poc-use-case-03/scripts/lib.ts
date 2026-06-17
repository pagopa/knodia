// Shared helpers for the POC UC03 ERDS-relay demo scripts.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { REPO_ROOT } from "./paths.ts";

const CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

// Exit with a clear message on any non-OK HTTP response (demo scripts fail fast).
export async function ensureOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    console.error(
      `${label} failed (${response.status}): ${await response.text()}`,
    );
    process.exit(1);
  }
}

export function requirePrivateKey(keyPath: string, hint: string): void {
  if (!existsSync(keyPath)) {
    console.error(`Private key not found at ${keyPath}. ${hint}`);
    process.exit(1);
  }
}

function signClientAssertion(keyPath: string, keychainId: string, purposeId: string): string {
  const result = spawnSync(
    "node",
    [
      resolve(REPO_ROOT, "scripts/local-auth/generate-client-assertion.ts"),
      "--key",
      keyPath,
      "--keychainId",
      keychainId,
      "--purposeId",
      purposeId,
    ],
    { encoding: "utf-8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  return result.stdout.trim();
}

// Mints an e-service access token: signs a client assertion with the consumer's
// private key and exchanges it at the producer knode's authorization-server.
export async function mintAccessToken(
  authorizationServerUrl: string,
  keyPath: string,
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  const assertion = signClientAssertion(keyPath, consumerKeychainId, purposeId);
  const response = await fetch(`${authorizationServerUrl}/token`, {
    body: new URLSearchParams({
      client_assertion: assertion,
      client_assertion_type: CLIENT_ASSERTION_TYPE,
      client_id: consumerKeychainId,
      grant_type: "client_credentials",
    }),
    method: "POST",
  });
  await ensureOk(response, `Token request to ${authorizationServerUrl}/token`);
  return ((await response.json()) as { access_token: string }).access_token;
}

export async function getJson(
  baseUrl: string,
  path: string,
  accessToken: string,
): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  await ensureOk(response, `GET ${path}`);
  return response.json();
}

export async function postJson(
  baseUrl: string,
  path: string,
  accessToken: string,
  body: unknown,
): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, {
    body: JSON.stringify(body),
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  await ensureOk(response, `POST ${path}`);
  return response.json();
}
