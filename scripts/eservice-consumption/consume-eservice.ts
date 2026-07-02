// Generic e-service consumption (KN-733): mint an access token for a consumer
// keychain + purpose and call one e-service endpoint. Assumes the consumption
// requirements (agreement, purpose, keychain with the public key uploaded,
// purpose-keychain link) already exist — created via the UI.
//
//   pnpm consume-eservice --env dev-lynx \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     --endpoint /natural-persons/RMNLNR03H12H501Z \
//     [--method POST] [--body '<json>'] \
//     [--auth dpop --dpop-key <es256-key.pem> [--dpop-alg ES256]]
//
// stdout: the e-service JSON response. stderr: progress logs.

import { parseArgs } from "node:util";

import { callEservice, type Dpop, log, mintAccessToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: {
    auth: { type: "string" },
    body: { type: "string" },
    "dpop-alg": { type: "string" },
    "dpop-key": { type: "string" },
    endpoint: { type: "string" },
    env: { type: "string" },
    key: { type: "string" },
    "keychain-id": { type: "string" },
    method: { type: "string" },
    "purpose-id": { type: "string" },
  },
  strict: true,
});

requireArgs(args, ["keychain-id", "purpose-id", "key", "endpoint"]);
if (args.auth === "dpop") requireArgs(args, ["dpop-key"]);

const env = urls(args.env);
const dpop: Dpop | undefined = args.auth === "dpop" ? { alg: (args["dpop-alg"] as "ES256" | "RS256") ?? "ES256", keyPath: args["dpop-key"]! } : undefined;

const { access_token, token_type } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!, dpop);
log(`Access token minted (${token_type})`);

const response = await callEservice(env.eservice, args.endpoint!, access_token, {
  body: args.body ? JSON.parse(args.body) : undefined,
  dpop,
  method: args.method ?? "GET",
});
log(`${args.method ?? "GET"} ${args.endpoint} → ${response.status}`);
print(response.body);
