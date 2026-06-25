import {
  mintAccessToken,
  requirePrivateKey,
} from "../../_shared/eservice-client.ts";
import {
  LYNX_AUTHORIZATION_SERVER_URL,
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  ORION_AUTHORIZATION_SERVER_URL,
  ORION_CONSUMER_PRIVATE_KEY_PATH,
} from "./paths.ts";

// systemSERCLynx consuming Orion's e-services (supervisory body + Orion relay):
// Lynx's consumer key, token issued by Orion's authorization-server.
export function mintLynxConsumerToken(
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  requirePrivateKey(LYNX_CONSUMER_PRIVATE_KEY_PATH, "generate-lynx-key");
  return mintAccessToken(
    ORION_AUTHORIZATION_SERVER_URL,
    LYNX_CONSUMER_PRIVATE_KEY_PATH,
    consumerKeychainId,
    purposeId,
  );
}

// systemSERCOrion consuming Lynx's relay: Orion's consumer key, token issued by
// Lynx's authorization-server.
export function mintOrionConsumerToken(
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  requirePrivateKey(ORION_CONSUMER_PRIVATE_KEY_PATH, "generate-orion-key");
  return mintAccessToken(
    LYNX_AUTHORIZATION_SERVER_URL,
    ORION_CONSUMER_PRIVATE_KEY_PATH,
    consumerKeychainId,
    purposeId,
  );
}
