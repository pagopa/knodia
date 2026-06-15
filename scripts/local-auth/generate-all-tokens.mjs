import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { TOKEN_TYPES } from "./token-types.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = resolve(__dirname, "generate-token.mjs");

const { values: args } = parseArgs({
  options: { env: { type: "string", default: "local" } },
});
const targetEnv = args.env;

for (const type of TOKEN_TYPES) {
  console.log(`\n--- Generating ${type} token (${targetEnv}) ---\n`);
  execFileSync("node", [script, "--type", type, "--env", targetEnv], {
    stdio: "inherit",
  });
}
