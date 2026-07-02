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

import { parseArgs } from "node:util";

import { callEservice, log, mintAccessToken, mintKnodeApiToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: { env: { type: "string" }, "eservice-id": { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "knode-api-auth": { type: "string" }, "knode-api-key": { type: "string" }, "knode-api-keychain-id": { type: "string" }, "knode-id": { type: "string" }, "person-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key"]);

const env = urls(args.env);
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!);
const person = args["person-id"] ?? "RMNLNR03H12H501Z";

log("Residence:");
print((await callEservice(env.eservice, `/natural-persons/${person}/residence`, access_token)).body);
log("Pseudonymization:");
print((await callEservice(env.eservice, "/natural-persons/pseudonymization", access_token)).body);

if (args["knode-api-keychain-id"]) {
  requireArgs(args, ["knode-api-key", "knode-id"]);
  const knodeApiToken = await mintKnodeApiToken(args["knode-api-auth"] ?? env.auth, args["knode-api-keychain-id"], args["knode-id"]!, args["knode-api-key"]!);
  // Seeded signal-hub mock e-service (scripts/seed/sql/orion/mock-signal-hub-eservice.sql).
  const eserviceId = args["eservice-id"] ?? "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7";
  const signalResponse = await fetch(`${env.signalHub}/signals/${eserviceId}?lastSignalId=0`, { headers: { authorization: `Bearer ${knodeApiToken}` } });
  if (!signalResponse.ok) throw new Error(`Signal pull failed (${signalResponse.status}): ${await signalResponse.text()}`);
  log("Signals:");
  print(((await signalResponse.json()) as { signals?: unknown[] }).signals ?? []);
}
