// Cross-Border E-service 02 ("Fornitura Dati", DPoP, Orion): digital contact of
// a natural person, with a DPoP-bound access token.
//
//   node mock-02-digital-contact-dpop.ts --env dev-orion \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     --dpop-key <es256-key.pem> [--dpop-alg ES256] [--person-id RMNLNR03H12H501Z]

import { parseArgs } from "node:util";

import { callEservice, type Dpop, mintAccessToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: { "dpop-alg": { type: "string" }, "dpop-key": { type: "string" }, env: { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "person-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key", "dpop-key"]);

const env = urls(args.env);
const dpop: Dpop = { alg: (args["dpop-alg"] as "ES256" | "RS256") ?? "ES256", keyPath: args["dpop-key"]! };
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!, dpop);
const response = await callEservice(env.eservice, `/natural-persons/${args["person-id"] ?? "RMNLNR03H12H501Z"}/digital-contact`, access_token, { dpop });
print(response.body);
