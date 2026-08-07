// Cross-Border E-service 03 ("Signal Hub", bearer, Orion): residence of a
// natural person plus the pseudonymization seed, and — when the Knode API flags
// are passed — a pull of the e-service's signals from the producer's Signal Hub.
//
//   node mock-03-residence-signal-hub.ts --env dev-orion \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     [--person-id RMNLNR03H12H501Z] \
//     [--eservice-id <uuid> --knode-api-keychain-id <uuid> --knode-api-key <pem> \
//      --knode-id <Orion|Lynx> --knode-api-auth <url>]
//
// The signal pull runs only when the Knode API flags are passed; its token is
// minted at the consumer knode's authorization-server (--knode-api-auth), which
// may differ from the producer's used for the access token.

import { createHash } from "node:crypto";
import { parseArgs } from "node:util";

import { callEservice, EserviceCallError, log, mintAccessToken, mintKnodeApiToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: { env: { type: "string" }, "eservice-id": { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "knode-api-auth": { type: "string" }, "knode-api-key": { type: "string" }, "knode-api-keychain-id": { type: "string" }, "knode-id": { type: "string" }, "person-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key"]);

const env = urls(args.env);
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!);
const person = args["person-id"] ?? "RMNLNR03H12H501Z";

log("Residence:");
// The mock rotates Create → Update → Delete phases: in the Delete window the
// residence 404s by design. Defer the failure until the signals confirm (or
// deny) that the person's latest signal is a DELETE.
let residenceError: string | undefined;
try {
  print((await callEservice(env.eservice, `/natural-persons/${person}/residence`, access_token)).body);
} catch (error) {
  // Only a 404 can be the deleted window; any other status is a real error.
  if (!(error instanceof EserviceCallError && error.status === 404)) throw error;
  residenceError = error.message;
  log(error.message);
}
log("Pseudonymization:");
const pseudonymization = (await callEservice(env.eservice, "/natural-persons/pseudonymization", access_token)).body as { seed: string };
print(pseudonymization);

if (args["knode-api-keychain-id"]) {
  requireArgs(args, ["knode-api-key", "knode-id"]);
  const knodeApiToken = await mintKnodeApiToken(args["knode-api-auth"] ?? env.auth, args["knode-api-keychain-id"], args["knode-id"]!, args["knode-api-key"]!);
  // Seeded signal-hub mock e-service (scripts/seed/sql/orion/mock-signal-hub-eservice.sql).
  const eserviceId = args["eservice-id"] ?? "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7";
  // The pull endpoint is paginated (default page size 10): follow the
  // lastSignalId cursor while the service returns 206 (more pages left).
  const PAGE_SIZE = 100;
  const allSignals: unknown[] = [];
  let cursor = 0;
  for (;;) {
    const signalResponse = await fetch(`${env.signalHub}/signals/${eserviceId}?lastSignalId=${cursor}&size=${PAGE_SIZE}`, { headers: { authorization: `Bearer ${knodeApiToken}` } });
    if (!signalResponse.ok) throw new Error(`Signal pull failed (${signalResponse.status}): ${await signalResponse.text()}`);
    const { lastSignalId, signals = [] } = (await signalResponse.json()) as { lastSignalId?: number; signals?: unknown[] };
    allSignals.push(...signals);
    if (signalResponse.status !== 206 || lastSignalId === undefined) break;
    cursor = lastSignalId;
  }
  log(`Signals: ${allSignals.length} total, printing the last 4:`);
  print(allSignals.slice(-4));

  if (residenceError) {
    // Same scheme as the producer: object_id = sha256(fiscalCode + seed).
    const objectId = createHash("sha256").update(person + pseudonymization.seed).digest("hex");
    const latest = allSignals.findLast(
      (s) => (s as { objectId?: string }).objectId === objectId,
    ) as { signalType?: string } | undefined;
    if (latest?.signalType === "DELETE") {
      log(`Residence 404 is expected: the latest signal for ${person} (object_id ${objectId}) is a DELETE — the mock is in its deleted window.`);
      residenceError = undefined;
    } else {
      log(`Latest signal for ${person} (object_id ${objectId}) is ${latest?.signalType ?? "absent"}, not DELETE: the residence failure is NOT explained by a deletion.`);
    }
  }
}

if (residenceError) throw new Error(residenceError);
