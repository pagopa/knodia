// Shared helpers for the e-service consumption scripts: mint an access token
// (bearer or DPoP-bound) at the producer knode's authorization-server and call
// an e-service. JWT signing is delegated to the scripts/local-auth generators.

import { spawnSync } from "node:child_process";
import { createHash, createPublicKey, createVerify } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Local services validate assertions/proofs against this static host; deployed
// envs derive audience/htu from the real authorization-server / e-service URL.
const LOCAL_HOST = "test.knodia.org";

// Base URLs per environment (mirrors collections/environments/*.bru).
export const ENVIRONMENTS = {
  local: { auth: "http://localhost:3700", eservice: "http://localhost:9999", k2o: "http://localhost:3900", signalHub: "http://localhost:3800" },
  "local-orion": { auth: "http://localhost:3701", eservice: "http://localhost:9991", k2o: "http://localhost:3901", signalHub: "http://localhost:3801" },
  "local-lynx": { auth: "http://localhost:3702", eservice: "http://localhost:9992", k2o: "http://localhost:3902", signalHub: "http://localhost:3802" },
  "dev-orion": { auth: "https://auth.orion.dev.knodia.com", eservice: "https://mock.orion.dev.knodia.com", k2o: "https://k2o.orion.dev.knodia.com", signalHub: "https://signalhub.orion.dev.knodia.com" },
  "dev-lynx": { auth: "https://auth.lynx.dev.knodia.com", eservice: "https://mock.lynx.dev.knodia.com", k2o: "https://k2o.lynx.dev.knodia.com", signalHub: "https://signalhub.lynx.dev.knodia.com" },
};

export function urls(env = "local") {
  const preset = ENVIRONMENTS[env as keyof typeof ENVIRONMENTS];
  if (!preset) throw new Error(`Unknown --env "${env}". One of: ${Object.keys(ENVIRONMENTS).join(", ")}`);
  return preset;
}

export interface Dpop {
  alg: "ES256" | "RS256";
  keyPath: string;
}

const isLocal = (url: string): boolean => new URL(url).hostname === "localhost";

function sign(script: string, args: string[]): string {
  const result = spawnSync("node", [resolve(REPO_ROOT, "scripts/local-auth", script), ...args], { encoding: "utf-8" });
  if (result.status !== 0) throw new Error(`${script} failed: ${result.stderr || result.stdout || result.error?.message}`);
  return result.stdout.trim();
}

const dpopProof = (dpop: Dpop, htm: string, htu: string, ath?: string): string =>
  sign("generate-dpop-proof.ts", ["--key", dpop.keyPath, "--alg", dpop.alg, "--htm", htm, "--htu", htu, ...(ath ? ["--ath", ath] : [])]);

async function requestToken(authUrl: string, path: "/knodeApiToken" | "/token", keychainId: string, keyPath: string, claim: string[], dpop?: Dpop) {
  const aud = isLocal(authUrl) ? LOCAL_HOST : `${new URL(authUrl).host}${path}`;
  const assertion = sign("generate-client-assertion.ts", ["--key", keyPath, "--keychainId", keychainId, ...claim, "--aud", aud]);
  const proof = dpop ? dpopProof(dpop, "POST", isLocal(authUrl) ? `https://${LOCAL_HOST}/token` : `${authUrl}/token`) : undefined;
  const response = await fetch(`${authUrl}${path}`, {
    body: new URLSearchParams({ client_assertion: assertion, client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer", client_id: keychainId, grant_type: "client_credentials" }),
    headers: proof ? { dpop: proof } : undefined,
    method: "POST",
  });
  if (!response.ok) throw new Error(`Token request to ${path} failed (${response.status}): ${await response.text()}`);
  return (await response.json()) as { access_token: string; token_type: string };
}

// E-service access token for a consumer keychain + purpose. With `dpop`, the
// token is bound to that key and every e-service call must carry a fresh proof.
export const mintAccessToken = (authUrl: string, keychainId: string, purposeId: string, keyPath: string, dpop?: Dpop) =>
  requestToken(authUrl, "/token", keychainId, keyPath, ["--purposeId", purposeId], dpop);

// Knode API token (Signal Hub pulls, producer key retrieval).
export const mintKnodeApiToken = (authUrl: string, keychainId: string, knodeId: string, keyPath: string) =>
  requestToken(authUrl, "/knodeApiToken", keychainId, keyPath, ["--knodeId", knodeId]).then((t) => t.access_token);

export interface EserviceResponse {
  body: any;
  headers: Headers;
  rawBody: string;
  status: number;
}

// Call an e-service with a bearer or DPoP-bound access token. With `dpop`, a
// fresh proof bound to the token (ath) and the resource URL is signed.
export async function callEservice(eserviceUrl: string, endpoint: string, accessToken: string, opts: { body?: unknown; dpop?: Dpop; method?: string } = {}): Promise<EserviceResponse> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {};
  if (opts.dpop) {
    headers.authorization = `DPoP ${accessToken}`;
    headers.dpop = dpopProof(opts.dpop, method, `${isLocal(eserviceUrl) ? `https://${LOCAL_HOST}` : eserviceUrl}${endpoint}`, accessToken);
  } else {
    headers.authorization = `Bearer ${accessToken}`;
  }
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${eserviceUrl}${endpoint}`, { body: opts.body === undefined ? undefined : JSON.stringify(opts.body), headers, method });
  const rawBody = await response.text();
  if (!response.ok) throw new Error(`${method} ${endpoint} failed (${response.status}): ${rawBody}`);
  return { body: rawBody ? JSON.parse(rawBody) : undefined, headers: response.headers, rawBody, status: response.status };
}

// Verify an Integrity REST 02 signed response: the Digest header matches the
// body, the Knodia-JWT-Signature verifies against the producer key fetched
// from the producer knode's k2o-gateway, and the signature payload binds the
// response headers it covers (signed_headers), so a signature can't be reused
// for a different response.
export async function verifyIntegrityRest02(response: EserviceResponse, k2oUrl: string, knodeApiToken: string): Promise<void> {
  const signatureJwt = response.headers.get("knodia-jwt-signature");
  const digest = response.headers.get("digest");
  if (!signatureJwt || !digest) throw new Error("Response is missing the Knodia-JWT-Signature or Digest header");
  const expectedDigest = `SHA-256=${createHash("sha256").update(response.rawBody).digest("base64")}`;
  if (digest !== expectedDigest) throw new Error(`Digest mismatch:\n  header: ${digest}\n  actual: ${expectedDigest}`);

  const [header, payload, signature] = signatureJwt.split(".");
  const kid = JSON.parse(Buffer.from(header, "base64url").toString()).kid;
  const keyResponse = await fetch(`${k2oUrl}/producerKeys/${encodeURIComponent(kid)}`, { headers: { authorization: `Bearer ${knodeApiToken}` } });
  if (!keyResponse.ok) throw new Error(`Producer key retrieval failed (${keyResponse.status}): ${await keyResponse.text()}`);
  const pem = Buffer.from(((await keyResponse.json()) as { encodedPem: string }).encodedPem, "base64").toString();
  const verifier = createVerify("RSA-SHA256").update(`${header}.${payload}`);
  if (!verifier.verify(createPublicKey(pem), Buffer.from(signature, "base64url"))) throw new Error("Knodia-JWT-Signature verification failed");

  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number; signed_headers: Record<string, string>[] };
  const signedHeaders: Record<string, string> = Object.assign({}, ...claims.signed_headers);
  if (!signedHeaders.digest) throw new Error("Knodia-JWT-Signature payload does not cover the Digest header");
  for (const [name, signed] of Object.entries(signedHeaders)) {
    const actual = response.headers.get(name);
    if (actual !== signed) throw new Error(`Knodia-JWT-Signature signed header "${name}" mismatch:\n  signed: ${signed}\n  actual: ${actual}`);
  }
  if (claims.exp <= Math.floor(Date.now() / 1000)) throw new Error("Knodia-JWT-Signature is expired");
}

// Exit with a clear message if a required flag is missing.
export function requireArgs(values: Record<string, unknown>, keys: string[]): void {
  const missing = keys.filter((k) => values[k] === undefined);
  if (missing.length) {
    console.error(`Missing required flag(s): ${missing.map((k) => `--${k}`).join(", ")}`);
    process.exit(1);
  }
}

// Progress goes to stderr so stdout stays a clean JSON result.
export const log = (message: string): void => console.error(message);
export const print = (value: unknown): void => console.log(JSON.stringify(value, null, 2));
