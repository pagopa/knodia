// POC UC02 — Phase 2 helper.
//
// Wraps scripts/local-auth/generate-keypair.ts to mint the keypairs the demo
// needs, stores the private keys at the fixed paths the other scripts read, and
// prints the public keys to paste into the keychains in the UI:
//   - consumer key  → the consumer e-service keychain
//   - knode-api key → the producer and consumer Knode API keychains
// Two keys are needed because a public key (kid) can live in only one keychain
// per knode, and the consumer holds two keychains on Orion.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  CONSUMER_PRIVATE_KEY_PATH,
  KNODE_API_PRIVATE_KEY_PATH,
  REPO_ROOT,
} from "./paths.ts";

function generateKeypair(): { privateKeyPath: string; publicKeyPath: string } {
  const result = spawnSync(
    "node",
    [
      resolve(REPO_ROOT, "scripts/local-auth/generate-keypair.ts"),
      "--alg",
      "RS256",
    ],
    { encoding: "utf-8" },
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  const output = `${result.stdout}\n${result.stderr}`;
  const privateKeyPath = /Private key\s+written to (.+)/
    .exec(output)?.[1]
    ?.trim();
  const publicKeyPath = /Public key\s+written to (.+)/.exec(output)?.[1]?.trim();
  if (!privateKeyPath || !publicKeyPath) {
    console.error("Could not locate the generated keys:");
    console.error(output);
    process.exit(1);
  }
  return { privateKeyPath, publicKeyPath };
}

function saveAndPrint(label: string, destination: string): void {
  const { privateKeyPath, publicKeyPath } = generateKeypair();
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(privateKeyPath, destination);
  console.error(`\n${label} private key saved to ${destination}`);
  console.error(`${label} public key (paste into the keychain in the UI):`);
  process.stdout.write(readFileSync(publicKeyPath, "utf-8"));
}

saveAndPrint("Consumer e-service", CONSUMER_PRIVATE_KEY_PATH);
saveAndPrint("Knode API", KNODE_API_PRIVATE_KEY_PATH);
