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

import rotatingAddresses from "../../apps/services/mock-eservice/src/data/rotatingAddresses.json" with { type: "json" };
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
let residenceError: EserviceCallError | undefined;
try {
  print((await callEservice(env.eservice, `/natural-persons/${person}/residence`, access_token)).body);
} catch (error) {
  // Only a 404 can be the deleted window; any other status is a real error.
  if (!(error instanceof EserviceCallError && error.status === 404)) throw error;
  residenceError = error;
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
  type Signal = { objectId?: string; signalType?: string };
  const allSignals: Signal[] = [];
  let cursor = 0;
  for (;;) {
    const signalResponse = await fetch(`${env.signalHub}/signals/${eserviceId}?lastSignalId=${cursor}&size=100`, { headers: { authorization: `Bearer ${knodeApiToken}` } });
    if (!signalResponse.ok) throw new Error(`Signal pull failed (${signalResponse.status}): ${await signalResponse.text()}`);
    const { lastSignalId, signals = [] } = (await signalResponse.json()) as { lastSignalId?: number; signals?: Signal[] };
    allSignals.push(...signals);
    if (signalResponse.status !== 206 || lastSignalId === undefined) break;
    cursor = lastSignalId;
  }
  // Same scheme as the producer: object_id = sha256(fiscalCode + seed). The
  // seed rotates per period, so only the current batch can be de-pseudonymized.
  const pseudonymize = (fiscalCode: string) => createHash("sha256").update(fiscalCode + pseudonymization.seed).digest("hex");
  const objectIdToFiscalCode = new Map(
    [...new Set([...Object.keys(rotatingAddresses), person])].map((fiscalCode) => [pseudonymize(fiscalCode), fiscalCode]),
  );
  const objectId = pseudonymize(person);

  log(`Signals: ${allSignals.length} total, printing the last 4 (de-pseudonymized with the current seed where possible):`);
  print(allSignals.slice(-4).map((s) => {
    const decoded = objectIdToFiscalCode.get(s.objectId ?? "");
    return decoded === undefined ? s : { ...s, decodedObjectId: decoded };
  }));

  if (residenceError) {
    const latest = allSignals.findLast((s) => s.objectId === objectId);
    if (latest?.signalType === "DELETE") {
      log(`Residence 404 is expected: the latest signal for ${person} (object_id ${objectId}) is a DELETE — the mock is in its deleted window.`);
      residenceError = undefined;
    } else {
      log(`Latest signal for ${person} (object_id ${objectId}) is ${latest?.signalType ?? "absent"}, not DELETE: the residence failure is NOT explained by a deletion.`);
    }
  }
}

if (residenceError) throw residenceError;

// Seed rotation cadence — keep in sync with SIGNAL_HUB_SEED_* in
// apps/services/mock-eservice/.env (local) and in knodia-deployment
// commons/knodes/<env>/values-commons.yaml (dev & test).
const ROTATION_START_DATE_MS = 1767225600000;
const rotationMs = ((args.env ?? "local").startsWith("local") ? 30 : 900) * 1000;
const now = Date.now();
const msLeft = rotationMs - ((now - ROTATION_START_DATE_MS) % rotationMs);
const secondsLeft = Math.ceil(msLeft / 1000);
const countdown = `${Math.floor(secondsLeft / 60)}m ${String(secondsLeft % 60).padStart(2, "0")}s`;
log(`Next mock rotation (new signal batch, next phase) in ~${countdown} (${new Date(now + msLeft).toISOString()}).`);
