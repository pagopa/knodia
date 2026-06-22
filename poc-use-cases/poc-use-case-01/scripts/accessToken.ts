import {
  mintAccessToken,
  requirePrivateKey,
} from "../../_shared/eservice-client.ts";
import { AUTHORIZATION_SERVER_URL, CONSUMER_PRIVATE_KEY_PATH } from "./paths.ts";

// Mints an e-service access token for the given consumer keychain + purpose by
// signing a client assertion with the local private key (written by generate-key)
// and exchanging it at the producer knode's authorization-server. Shared by
// retrieve-qualifications (provide-data) and set-qualification (receive-data).
// Throws on failure; the CLI entry scripts catch and exit.
export function mintEserviceAccessToken(
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  requirePrivateKey(CONSUMER_PRIVATE_KEY_PATH, "generate-key");
  return mintAccessToken(
    AUTHORIZATION_SERVER_URL,
    CONSUMER_PRIVATE_KEY_PATH,
    consumerKeychainId,
    purposeId,
  );
}
