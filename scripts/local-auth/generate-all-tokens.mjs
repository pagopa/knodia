import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { SIGNUP_DOMAIN_KEY_NAMES, TOKEN_TYPES } from "./token-types.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = resolve(__dirname, "generate-token.mjs");

const { values: args } = parseArgs({
  options: { env: { type: "string", default: "local" } },
});
const targetEnv = args.env;

// Signup-domain tokens are routed to dev-signup automatically, so the given
// env must be a knode one.
if (targetEnv === "dev-signup") {
  console.error("Use --env dev-lynx or dev-orion: signup-domain tokens are routed to dev-signup automatically");
  process.exit(1);
}

for (const type of TOKEN_TYPES) {
  const envForType =
    targetEnv !== "local" && type in SIGNUP_DOMAIN_KEY_NAMES ? "dev-signup" : targetEnv;
  console.log(`\n--- Generating ${type} token (${envForType}) ---\n`);
  execFileSync("node", [script, "--type", type, "--env", envForType], {
    stdio: "inherit",
  });
}
