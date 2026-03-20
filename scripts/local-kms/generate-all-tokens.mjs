import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { TOKEN_TYPES } from "./token-types.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = resolve(__dirname, "generate-token.mjs");

for (const type of TOKEN_TYPES) {
  console.log(`\n--- Generating ${type} token ---\n`);
  execFileSync("node", [script, type], { stdio: "inherit" });
}
