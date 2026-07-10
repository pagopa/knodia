// Decode a JWT and print its header and payload (the signature is not verified).
//
//   pnpm decode-jwt <jwt>

import { parseArgs } from "node:util";

import { print } from "./lib.ts";

const { positionals } = parseArgs({ allowPositionals: true, strict: true });

const [header, payload] = (positionals.at(0) ?? "").split(".");
if (!header || !payload) {
  console.error("Usage: pnpm decode-jwt <jwt>");
  process.exit(1);
}

const decode = (part: string): unknown => JSON.parse(Buffer.from(part, "base64url").toString());
print({ header: decode(header), payload: decode(payload) });
