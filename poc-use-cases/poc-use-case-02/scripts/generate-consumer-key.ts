// POC UC02 — Phase 2 helper.
//
// Generates the keypair for the consumer e-service keychain (Orion): saves the
// private key to the fixed path the retrieval scripts read, and prints the
// public key to paste into the keychain in the UI.

import { generateAndSaveKeypair } from "./keys.ts";
import { CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

generateAndSaveKeypair("Consumer e-service", CONSUMER_PRIVATE_KEY_PATH);
