import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(here, "../../..");

// UC02 companies e-service identity, seeded on Lynx
// (scripts/seed/sql/lynx/mock-poc-uc02-companies-eservice.sql) and pinned in
// apps/services/mock-eservice/src/pocUc02Companies/mockup.ts.
export const COMPANIES_ESERVICE_ID = "16895bc2-deb0-427c-8c25-336207b2d0a1";

// Fixed key paths (no --key flag): the contract between the generate-* scripts
// (write) and the demo scripts (read). Gitignored via poc-use-case-02/.gitignore.
export const CONSUMER_PRIVATE_KEY_PATH = resolve(
  here,
  "../.local/consumer-private-key.pem",
);
// Distinct keys for the producer's and consumer's Knode API keychains.
export const PRODUCER_KNODE_API_PRIVATE_KEY_PATH = resolve(
  here,
  "../.local/producer-knode-api-private-key.pem",
);
export const CONSUMER_KNODE_API_PRIVATE_KEY_PATH = resolve(
  here,
  "../.local/consumer-knode-api-private-key.pem",
);

// UC02 e-service is published on Lynx (scripts/seed/sql/lynx/*). The access
// token is issued by the producer knode's authorization-server and the
// e-service is served by the producer knode's mock. Override the base URLs for
// non-local environments.
export const AUTHORIZATION_SERVER_URL =
  process.env.POC_AUTHORIZATION_SERVER_URL ?? "http://localhost:3702";
export const MOCK_ESERVICE_URL =
  process.env.POC_MOCK_ESERVICE_URL ?? "http://localhost:9992";

// Signals are published to and pulled from the producer knode's (Lynx) Signal Hub.
export const SIGNAL_HUB_URL =
  process.env.POC_SIGNAL_HUB_URL ?? "http://localhost:3802";

// The consumer's Knode API token is minted by the consumer knode's (Orion)
// authorization-server, since its Knode API keychain lives there.
export const CONSUMER_AUTHORIZATION_SERVER_URL =
  process.env.POC_CONSUMER_AUTHORIZATION_SERVER_URL ?? "http://localhost:3701";
