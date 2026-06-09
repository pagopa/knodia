// POC UC02 — Phase 2 helper. Generates the consumer e-service keychain key
// (Orion) and prints its public key to paste into the keychain.

import { generateAndSaveKeypair } from "./keys.ts";
import { CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

generateAndSaveKeypair("Consumer e-service", CONSUMER_PRIVATE_KEY_PATH);
