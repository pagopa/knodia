import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  AUTHORIZATION_SERVER_URL,
  CONSUMER_PRIVATE_KEY_PATH,
  REPO_ROOT,
} from "./paths.ts";

// Mints an e-service access token for the given consumer keychain + purpose by
// signing a client assertion with the local private key (written by generate-key)
// and exchanging it at the producer knode's authorization-server. Shared by
// retrieve-qualifications (provide-data) and set-qualification (receive-data).
export async function mintEserviceAccessToken(
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  if (!existsSync(CONSUMER_PRIVATE_KEY_PATH)) {
    console.error(
      `Private key not found at ${CONSUMER_PRIVATE_KEY_PATH}. Run generate-key first.`,
    );
    process.exit(1);
  }

  const assertion = spawnSync(
    "node",
    [
      resolve(REPO_ROOT, "scripts/local-auth/generate-client-assertion.ts"),
      "--key",
      CONSUMER_PRIVATE_KEY_PATH,
      "--keychainId",
      consumerKeychainId,
      "--purposeId",
      purposeId,
    ],
    { encoding: "utf-8" },
  );

  if (assertion.status !== 0) {
    console.error(assertion.stderr || assertion.stdout);
    process.exit(1);
  }

  const clientAssertion = assertion.stdout.trim();

  const tokenResponse = await fetch(`${AUTHORIZATION_SERVER_URL}/token`, {
    body: new URLSearchParams({
      client_assertion: clientAssertion,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_id: consumerKeychainId,
      grant_type: "client_credentials",
    }),
    method: "POST",
  });

  if (!tokenResponse.ok) {
    console.error(
      `Access token request failed (${tokenResponse.status}): ${await tokenResponse.text()}`,
    );
    process.exit(1);
  }

  const { access_token: accessToken } = (await tokenResponse.json()) as {
    access_token: string;
  };
  return accessToken;
}
