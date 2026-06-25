import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Consumer private keys — one per SERC (no key shared across orgs). Written by
// generate-lynx-key / generate-orion-key, read by the demo scripts. Gitignored
// via the shared poc-use-cases/.gitignore (.local/).
export const LYNX_CONSUMER_PRIVATE_KEY_PATH = resolve(
  here,
  "../.local/lynx-consumer-private-key.pem",
);
export const ORION_CONSUMER_PRIVATE_KEY_PATH = resolve(
  here,
  "../.local/orion-consumer-private-key.pem",
);

// The access token for a consumption chain is issued by the PRODUCER knode's
// authorization-server: supervisoryBodyOrion and systemSERCOrion publish on
// Orion (3701); systemSERCLynx publishes on Lynx (3702). Override for non-local.
export const ORION_AUTHORIZATION_SERVER_URL =
  process.env.POC_ORION_AUTHORIZATION_SERVER_URL ?? "http://localhost:3701";
export const LYNX_AUTHORIZATION_SERVER_URL =
  process.env.POC_LYNX_AUTHORIZATION_SERVER_URL ?? "http://localhost:3702";

// supervisoryBodyOrion's provide-data e-service is served by the Orion mock.
export const SUPERVISORY_BODY_MOCK_URL =
  process.env.POC_SUPERVISORY_BODY_MOCK_URL ?? "http://localhost:9991";

// Each SERC's relay endpoint, known point-to-point by the consumer (getERDSMetadata
// resolves which SERC serves a recipient, not how to reach its relay).
export const ORION_RELAY_URL =
  process.env.POC_ORION_RELAY_URL ?? "http://localhost:9991";
export const LYNX_RELAY_URL =
  process.env.POC_LYNX_RELAY_URL ?? "http://localhost:9992";

export const RELAY_URL_BY_SERC = {
  systemSERCLynx: LYNX_RELAY_URL,
  systemSERCOrion: ORION_RELAY_URL,
} as const;

// Sample sender (citizen senderLynx) — hardcoded, narrated in the demo.
export const SAMPLE_SENDER_IDENTIFIER = {
  notation: "MRARSS80A01L259A",
  schemeName: "Codice Fiscale",
  schemeURI: "http://memberstate.ms/PIdentifier",
} as const;

// Recipients are identified by VAT in the demo (e.g. 01229430085).
export const RECIPIENT_SCHEME = {
  schemeName: "Partita Iva",
  schemeURI: "http://memberstate.ms/VAT",
} as const;
export const SAMPLE_RECIPIENT_ID = "01229430085";
