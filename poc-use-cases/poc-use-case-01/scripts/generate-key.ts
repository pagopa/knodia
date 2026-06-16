// POC UC01 — Phase 2 helper.
//
// Mints an RS256 keypair, stores the private key at the fixed path read by the
// retrieval/registration scripts, and prints the public key PEM to stdout —
// paste it into the consumer keychain key in the UI (Phase 2 of the run-book).

import { generateAndSaveKeypair } from "../../_shared/keys.ts";
import { CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

generateAndSaveKeypair("Consumer", CONSUMER_PRIVATE_KEY_PATH);
