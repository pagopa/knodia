// Signs a JWT DPoP proof (ES256 or RS256) for the local
// authorization-server or mock-eservice and writes it to
// collections/.env as DPOP_PROOF_JWT so the relevant Bruno
// requests can pick it up.
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

const SUPPORTED_ALGS = ["ES256", "RS256"];

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

const { key, htu, alg, htm, ath } = values;

if (!SUPPORTED_ALGS.includes(alg)) {
  console.error(`Error: --alg must be one of: ${SUPPORTED_ALGS.join(", ")}`);
  process.exit(1);
}

if (!key) {
  console.error(`Usage: node scripts/local-auth/generate-dpop-proof.ts \\
  --key <path-to-pem-private-key> \\
  [--alg ES256|RS256] \\
  [--htu <url>] \\
  [--htm <http-method>] \\
  [--ath <dpop-bound-access-token>]

--alg defaults to ES256; must match the type of the provided private key.
--htu defaults to ${DEFAULT_HTU} (local authorization-server token endpoint).
   Override with the resource URL (e.g. https://test.knodia.org/natural-persons/RMNLNR03H12H501Z/digital-contact)
   when minting a proof for a resource call (e.g., mock-eservice endpoints)
--htm defaults to POST; set to the HTTP method of the target request.
--ath is required when the proof is bound to an access token (resource calls, e.g. mock-eservice endpoints).

Use \`pnpm generate-keypair --alg <RS256|ES256>\` first if you don't have a keypair yet.`);
  process.exit(1);
}

const b64url = (data: string | Buffer): string =>
  Buffer.from(data).toString("base64url");

const privatePem = readFileSync(key, "utf-8");
const publicKeyJwk = createPublicKey(privatePem).export({
  format: "jwk",
}) as JsonWebKey;

console.error(`Using private key from ${key}`);

const now = Math.floor(Date.now() / 1000);
const header = b64url(
  JSON.stringify({ alg, jwk: publicKeyJwk, typ: "dpop+jwt" })
);
const payload = b64url(
  JSON.stringify({
    ath: ath
      ? createHash("sha256").update(ath).digest("base64url")
      : undefined,
    htm,
    htu,
    iat: now,
    jti: randomUUID(),
  })
);
const signingInput = `${header}.${payload}`;
const signingAlg = alg === "ES256" ? "SHA256" : "RSA-SHA256";
const signer = createSign(signingAlg);
signer.update(signingInput);

const rawSignature = signer.sign({
  key: privatePem,
  dsaEncoding: "ieee-p1363",
});
const signature = rawSignature.toString("base64url");

const dpopProof = `${signingInput}.${signature}`;

let existing = "";
try {
  existing = readFileSync(COLLECTIONS_ENV_PATH, "utf-8");
} catch {
  /* new file */
}
const envLine = `DPOP_PROOF_JWT=${dpopProof}`;
const pattern = /^DPOP_PROOF_JWT=.*$/m;
writeFileSync(
  COLLECTIONS_ENV_PATH,
  pattern.test(existing)
    ? existing.replace(pattern, envLine)
    : existing.trimEnd() + "\n" + envLine + "\n"
);
console.error(`Bruno env written to ${COLLECTIONS_ENV_PATH}`);

process.stdout.write(`${dpopProof}\n`);
