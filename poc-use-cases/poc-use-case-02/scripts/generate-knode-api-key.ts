// POC UC02 — Phase 4 helper. Generates the two Knode API keychain keys (one for
// the producer on Lynx, one for the consumer on Orion) and prints their public
// keys to paste into the respective keychains.

import { generateAndSaveKeypair } from "./keys.ts";
import {
  CONSUMER_KNODE_API_PRIVATE_KEY_PATH,
  PRODUCER_KNODE_API_PRIVATE_KEY_PATH,
} from "./paths.ts";

generateAndSaveKeypair("Producer Knode API", PRODUCER_KNODE_API_PRIVATE_KEY_PATH);
generateAndSaveKeypair("Consumer Knode API", CONSUMER_KNODE_API_PRIVATE_KEY_PATH);
