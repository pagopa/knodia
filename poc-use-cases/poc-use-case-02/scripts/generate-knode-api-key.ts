// POC UC02 — Phase 4 helper.
//
// Generates the keypair for the Knode API keychains: saves the private key to
// the fixed path the publish/recover scripts read, and prints the public key to
// paste into the keychain in the UI. The same key is uploaded to both the
// producer's (Lynx) and the consumer's (Orion) Knode API keychain — they live
// on different knodes, so the same public key (kid) can be reused.

import { generateAndSaveKeypair } from "./keys.ts";
import { KNODE_API_PRIVATE_KEY_PATH } from "./paths.ts";

generateAndSaveKeypair("Knode API", KNODE_API_PRIVATE_KEY_PATH);
