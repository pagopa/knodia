// Helpers for the POC UC02 Signal Hub demo scripts (Phase 4).
//
// The generic e-service access logic is shared with the other POCs
// (../../_shared/eservice-client.ts); the wrappers here bind UC02's paths and
// keep the demo's fail-fast (process.exit) style so the scripts stay simple.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";

import {
  ensureOk,
  getJson,
  mintAccessToken as mintAccessTokenOrThrow,
  mintKnodeApiToken as mintKnodeApiTokenOrThrow,
} from "../../_shared/eservice-client.ts";
import {
  CONSUMER_KNODE_API_PRIVATE_KEY_PATH,
  CONSUMER_PRIVATE_KEY_PATH,
  MOCK_ESERVICE_URL,
  PRODUCER_KNODE_API_PRIVATE_KEY_PATH,
} from "./paths.ts";

// Demo scripts fail fast: print the message and exit on any error.
function exitOnError(error: unknown): never {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// Matches the mock e-service's object_id scheme so producer and consumer derive
// the same id for a company's evidence.
export function objectIdForCompany(companyId: string, seed: string): string {
  return createHash("sha256").update(companyId + seed).digest("hex");
}

// Exit with a clear message on any non-OK HTTP response (demo scripts fail fast).
export async function assertOk(response: Response, label: string): Promise<void> {
  try {
    await ensureOk(response, label);
  } catch (error) {
    exitOnError(error);
  }
}

const KEY_GENERATOR: Record<string, string> = {
  [CONSUMER_PRIVATE_KEY_PATH]: "generate-consumer-key",
  [PRODUCER_KNODE_API_PRIVATE_KEY_PATH]: "generate-knode-api-key",
  [CONSUMER_KNODE_API_PRIVATE_KEY_PATH]: "generate-knode-api-key",
};

export function assertPrivateKeysExist(...keyPaths: string[]): void {
  for (const keyPath of keyPaths) {
    if (!existsSync(keyPath)) {
      console.error(
        `Private key not found at ${keyPath}. Run ${KEY_GENERATOR[keyPath]} first.`,
      );
      process.exit(1);
    }
  }
}

export function mintAccessToken(
  authorizationServerUrl: string,
  consumerKeychainId: string,
  purposeId: string,
): Promise<string> {
  return mintAccessTokenOrThrow(
    authorizationServerUrl,
    CONSUMER_PRIVATE_KEY_PATH,
    consumerKeychainId,
    purposeId,
  ).catch(exitOnError);
}

export function mintKnodeApiToken(
  authorizationServerUrl: string,
  knodeApiKeychainId: string,
  knodeId: string,
  privateKeyPath: string,
): Promise<string> {
  return mintKnodeApiTokenOrThrow(
    authorizationServerUrl,
    privateKeyPath,
    knodeApiKeychainId,
    knodeId,
  ).catch(exitOnError);
}

// Marks the company's evidence as changed on the mock e-service (out-of-spec
// route, gated by the producer's Knode API token) so the recover step sees an
// update. Returns the new evidence revision.
export async function triggerEvidenceUpdate(
  companyId: string,
  knodeApiToken: string,
): Promise<number> {
  const response = await fetch(
    `${MOCK_ESERVICE_URL}/legal-entities/${companyId}/evidence-update`,
    {
      headers: { authorization: `Bearer ${knodeApiToken}` },
      method: "POST",
    },
  );
  await assertOk(response, "Evidence update");
  return ((await response.json()) as { evidenceRevision: number })
    .evidenceRevision;
}

// GET a JSON resource from the mock e-service with a bearer access token.
export function getMockJson(
  path: string,
  accessToken: string,
): Promise<unknown> {
  return getJson(MOCK_ESERVICE_URL, path, accessToken).catch(exitOnError);
}

export async function getPseudonymizationSeed(
  accessToken: string,
): Promise<string> {
  const body = (await getMockJson(
    "/legal-entities/pseudonymization",
    accessToken,
  )) as { seed: string };
  return body.seed;
}
