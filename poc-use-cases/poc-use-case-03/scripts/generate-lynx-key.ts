// POC UC03 — Phase 2 helper. Generates systemSERCLynx's consumer e-service key
// and prints its public key to paste into the consumer keychain on Lynx.

import { generateAndSaveKeypair } from "../../_shared/keys.ts";
import { LYNX_CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

generateAndSaveKeypair("systemSERCLynx consumer", LYNX_CONSUMER_PRIVATE_KEY_PATH);
