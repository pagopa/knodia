// Shared across the POC demo script folders (poc-use-case-0X/scripts).
//
// Cross-border e-service access helpers: sign a client assertion with a local
// private key, exchange it for an access / Knode API token at an
// authorization-server, and call a mock e-service with a bearer token.
//
// These are a library: they THROW on failure (no process.exit). Callers decide
// how to surface it — UC01's CLI entries catch and exit; UC02's lib.ts wraps
// them to keep its fail-fast style.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

// Throw with the response body on any non-OK HTTP response.
export async function ensureOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${await response.text()}`);
  }
}

export function requirePrivateKey(keyPath: string, generatorHint: string): void {
  if (!existsSync(keyPath)) {
    throw new Error(
      `Private key not found at ${keyPath}. Run ${generatorHint} first.`,
    );
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
    // On a spawn failure (status === null) stderr/stdout are empty; surface the
    // spawn error so the caller gets a message instead of a blank line.
    throw new Error(
      `Client assertion generation failed: ${result.stderr || result.stdout || result.error?.message || "unknown error"}`,
    );
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
  await ensureOk(response, `Token request to ${path}`);
  return ((await response.json()) as { access_token: string }).access_token;
}

// E-service access token (/token), signed for a consumer keychain + purpose.
// async so a synchronous client-assertion failure surfaces as a rejection.
export async function mintAccessToken(
  authorizationServerUrl: string,
  consumerPrivateKeyPath: string,
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  const assertion = signClientAssertion(
    consumerPrivateKeyPath,
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

// Knode API token (/knodeApiToken), signed for a Knode API keychain + knodeId.
// async so a synchronous client-assertion failure surfaces as a rejection.
export async function mintKnodeApiToken(
  authorizationServerUrl: string,
  knodeApiPrivateKeyPath: string,
  knodeApiKeychainId: string,
  knodeId: string,
): Promise<string> {
  const assertion = signClientAssertion(
    knodeApiPrivateKeyPath,
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

// GET a JSON resource from a mock e-service with a bearer access token.
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
