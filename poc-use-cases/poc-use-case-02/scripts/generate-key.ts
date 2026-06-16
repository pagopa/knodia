// POC UC02 — Phase 2 helper.
//
// Wraps scripts/local-auth/generate-keypair.ts to mint an RS256 keypair, stores
// the private key at the fixed path read by retrieve-company-data, and prints
// the public key PEM to stdout — paste it into the consumer keychain key in the
// UI (Phase 2 of the run-book).

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CONSUMER_PRIVATE_KEY_PATH, REPO_ROOT } from "./paths.ts";

const result = spawnSync(
  "node",
  [resolve(REPO_ROOT, "scripts/local-auth/generate-keypair.ts"), "--alg", "RS256"],
  { encoding: "utf-8" },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const output = `${result.stdout}\n${result.stderr}`;
const privateKeyPath = /Private key\s+written to (.+)/.exec(output)?.[1]?.trim();
const publicKeyPath = /Public key\s+written to (.+)/.exec(output)?.[1]?.trim();

if (!privateKeyPath || !publicKeyPath) {
  console.error("Could not locate the generated keys in generate-keypair output:");
  console.error(output);
  process.exit(1);
}

mkdirSync(dirname(CONSUMER_PRIVATE_KEY_PATH), { recursive: true });
copyFileSync(privateKeyPath, CONSUMER_PRIVATE_KEY_PATH);

console.error(`Private key saved to ${CONSUMER_PRIVATE_KEY_PATH}`);
console.error("Public key (paste into the consumer keychain in the UI):\n");
process.stdout.write(readFileSync(publicKeyPath, "utf-8"));
