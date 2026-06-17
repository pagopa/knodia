// POC UC03 — Phase 4 helper. Generates systemSERCOrion's consumer e-service key
// and prints its public key to paste into the consumer keychain on Orion.

import { generateAndSaveKeypair } from "./keys.ts";
import { ORION_CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

generateAndSaveKeypair(
  "systemSERCOrion consumer",
  ORION_CONSUMER_PRIVATE_KEY_PATH,
);
