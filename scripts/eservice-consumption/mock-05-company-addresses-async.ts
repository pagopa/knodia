// Cross-Border E-service 05 ("Comunicazione Asincrona", bearer, Lynx): pull-based
// async pattern — submit legal entity identifiers, poll the request state until
// COMPLETED, then fetch the produced resource.
//
//   node mock-05-company-addresses-async.ts --env dev-lynx \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     [--company-ids 01229430085,12345678901,00000000000]

import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";

import { callEservice, log, mintAccessToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: { "company-ids": { type: "string" }, env: { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key"]);

const env = urls(args.env);
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!);
const companyIds = (args["company-ids"] ?? "01229430085,12345678901,00000000000").split(",").map((id) => id.trim());

const { requestId } = (await callEservice(env.eservice, "/legal-entities/address-requests", access_token, { body: companyIds, method: "POST" })).body;
log(`Request ${requestId} accepted, polling ...`);

let resourceId: string | undefined;
for (let attempt = 0; attempt < 30 && !resourceId; attempt++) {
  const state = (await callEservice(env.eservice, `/legal-entities/address-requests/${requestId}`, access_token)).body;
  log(`  state: ${state.state}`);
  if (state.state === "COMPLETED") resourceId = state.resourceId;
  else await sleep(5000);
}
if (!resourceId) throw new Error(`Request ${requestId} did not complete in time`);

const response = await callEservice(env.eservice, `/legal-entities/address-requests/${requestId}/resources/${resourceId}`, access_token);
print(response.body);
