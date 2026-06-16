import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Fixed path shared between generate-key (writes) and the retrieval/registration
// scripts (read): the demo deliberately has no --key parameter, so the location
// is the contract between the steps. Gitignored via poc-use-case-01/.gitignore.
export const CONSUMER_PRIVATE_KEY_PATH = resolve(
  here,
  "../.local/consumer-private-key.pem",
);

// UC01 e-services are published on Lynx (scripts/seed/sql/lynx/*). The access
// token is issued by the producer knode's authorization-server and the
// e-services are served by the producer knode's mock. Override the base URLs for
// non-local environments.
export const AUTHORIZATION_SERVER_URL =
  process.env.POC_AUTHORIZATION_SERVER_URL ?? "http://localhost:3702";
export const MOCK_ESERVICE_URL =
  process.env.POC_MOCK_ESERVICE_URL ?? "http://localhost:9992";
