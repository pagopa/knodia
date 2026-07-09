// Cross-Border E-service 01 ("Fornitura Dati", bearer, Orion): personal
// information of a natural person.
//
//   node mock-01-personal-information.ts --env dev-orion \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     [--person-id RMNLNR03H12H501Z]

import { parseArgs } from "node:util";

import { callEservice, mintAccessToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: { env: { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "person-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key"]);

const env = urls(args.env);
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!);
const response = await callEservice(env.eservice, `/natural-persons/${args["person-id"] ?? "RMNLNR03H12H501Z"}`, access_token);
print(response.body);
