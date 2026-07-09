// Cross-Border E-service 06 ("Fornitura Dati" with signed response, bearer, Lynx):
// legal entity address, with Integrity REST 02 signed-response verification
// (the producer key is fetched from the producer knode's k2o-gateway, so the
// Knode API flags are required).
//
//   node mock-06-company-address-integrity.ts --env dev-lynx \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     --knode-api-keychain-id <uuid> --knode-api-key <pem> --knode-id <Orion|Lynx> \
//     [--knode-api-auth <url>] [--company-id 12345678901]

import { parseArgs } from "node:util";

import { callEservice, log, mintAccessToken, mintKnodeApiToken, print, requireArgs, urls, verifyIntegrityRest02 } from "./lib.ts";

const { values: args } = parseArgs({
  options: { "company-id": { type: "string" }, env: { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "knode-api-auth": { type: "string" }, "knode-api-key": { type: "string" }, "knode-api-keychain-id": { type: "string" }, "knode-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key", "knode-api-keychain-id", "knode-api-key", "knode-id"]);

const env = urls(args.env);
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!);
const response = await callEservice(env.eservice, `/legal-entities/${args["company-id"] ?? "12345678901"}/address`, access_token);

const knodeApiToken = await mintKnodeApiToken(args["knode-api-auth"] ?? env.auth, args["knode-api-keychain-id"]!, args["knode-id"]!, args["knode-api-key"]!);
await verifyIntegrityRest02(response, env.k2o, knodeApiToken);
log("Integrity REST 02 verification passed");
print(response.body);
