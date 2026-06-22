// Shared across the POC demo script folders (poc-use-case-0X/scripts).
//
// Generates a keypair via scripts/local-auth/generate-keypair.ts, saves the
// private key to a fixed path the demo scripts read, and prints the public key
// PEM to stdout (paste it into the keychain in the UI). Fail-fast: this is the
// whole action of a generate-* script, so it exits the process on error.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

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
    console.error(
      result.stderr || result.stdout || result.error?.message || "unknown error",
    );
    process.exit(1);
  }
  const output = `${result.stdout}\n${result.stderr}`;
  const privateKeyPath = /Private key\s+written to (.+)/
    .exec(output)?.[1]
    ?.trim();
  const publicKeyPath = /Public key\s+written to (.+)/.exec(output)?.[1]?.trim();
  if (!privateKeyPath || !publicKeyPath) {
    console.error("Could not locate the generated keys in generate-keypair output:");
    console.error(output);
    process.exit(1);
  }
  return { privateKeyPath, publicKeyPath };
}

export function generateAndSaveKeypair(label: string, destination: string): void {
  const { privateKeyPath, publicKeyPath } = generateKeypair();
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(privateKeyPath, destination);
  console.error(`\n${label} private key saved to ${destination}`);
  console.error(`${label} public key (paste into the keychain in the UI):`);
  process.stdout.write(readFileSync(publicKeyPath, "utf-8"));
}
