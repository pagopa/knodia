// Signs an ES256 JWT DPoP proof for the local authorization-server
// and writes it to collections/.env as DPOP_PROOF_JWT so the
// authorization-server/Create Token.bru call can pick it up.
//
// stdout: the signed JWT and nothing else (so it can be piped / captured).
// stderr: everything else (logs, usage).

import {
  createHash,
  createPublicKey,
  createSign,
  randomUUID,
} from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COLLECTIONS_ENV_PATH = resolve(__dirname, "../../collections/.env");

// Defaults target the local authorization-server.
const DEFAULT_HTU = "https://test.knodia.org/token";

const { values } = parseArgs({
  options: {
    alg: { type: "string", default: "ES256" },
    ath: { type: "string" },
    htm: { type: "string", default: "POST" },
    htu: { type: "string", default: DEFAULT_HTU },
    key: { type: "string" },
  },
  strict: true,
});

const { key: keyPath, htu, htm, alg } = values;

if (!values.key) {
  console.error(`Usage: node scripts/local-auth/generate-dpop-proof.ts \\
  --alg <ES256|RS256> \\
  --ath <expected-ath-for-resource-server> \\
  --key <path-to-pem-private-key> \\
  --htu <expected-htu-from-env> \\
  --htm <expected-htm-from-env> \\

Use \`pnpm generate-keypair --alg <RS256|ES256>\` first if you don't have a keypair yet.`);
  process.exit(1);
}

const b64url = (data: string | Buffer): string =>
  Buffer.from(data).toString("base64url");

const privatePem = readFileSync(keyPath, "utf-8");
const publicKeyJwk = createPublicKey(privatePem).export({
  format: "jwk",
}) as JsonWebKey;

console.error(`Using private key from ${keyPath}`);

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg, jwk: publicKeyJwk, typ: "dpop+jwt" }));
const payload = b64url(
  JSON.stringify({
    ath: values.ath
      ? createHash("sha256").update(values.ath).digest("base64url")
      : undefined,
    htm,
    htu,
    iat: now,
    jti: randomUUID(),
  }),
);
const signingInput = `${header}.${payload}`;
const signingAlg = alg === "ES256" ? "SHA256" : "RSA-SHA256";
const signer = createSign(signingAlg);
signer.update(signingInput);
const rawSignature = signer.sign(privatePem);

// ES256 JWT signatures must be in IEEE P1363 format (r || s), not DER.
// Node.js createSign outputs DER-encoded ASN.1 for EC keys, so convert it.
let signature: string;
if (alg === "ES256") {
  // DER structure: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  let offset = 2; // skip 0x30 and total length
  offset += 1; // skip 0x02
  const rLen = rawSignature[offset++]!;
  const r = rawSignature.subarray(offset, offset + rLen);
  offset += rLen;
  offset += 1; // skip 0x02
  const sLen = rawSignature[offset++]!;
  const s = rawSignature.subarray(offset, offset + sLen);
  // Pad/trim to 32 bytes each (remove leading 0x00 padding bytes from DER)
  const pad = (buf: Buffer) => {
    const trimmed = buf[0] === 0 ? buf.subarray(1) : buf;
    return Buffer.concat([Buffer.alloc(32 - trimmed.length), trimmed]);
  };
  signature = Buffer.concat([pad(r), pad(s)]).toString("base64url");
} else {
  signature = rawSignature.toString("base64url");
}
const dpopProof = `${signingInput}.${signature}`;

let existing = "";
try { existing = readFileSync(COLLECTIONS_ENV_PATH, "utf-8"); } catch { /* new file */ }
const envLine = `DPOP_PROOF_JWT=${dpopProof}`;
const pattern = /^DPOP_PROOF_JWT=.*$/m;
writeFileSync(
  COLLECTIONS_ENV_PATH,
  pattern.test(existing) ? existing.replace(pattern, envLine) : existing.trimEnd() + "\n" + envLine + "\n",
);
console.error(`Bruno env written to ${COLLECTIONS_ENV_PATH}`);

process.stdout.write(`${dpopProof}\n`);
