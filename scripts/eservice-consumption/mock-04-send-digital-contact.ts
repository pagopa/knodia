// Cross-Border E-service 04 ("Ricezione Dati", bearer, Lynx): forward a legal
// entity's digital contact to the producer, which replies with an ack. The
// legal entity must exist in the producer's registry (404 otherwise).
//
//   node mock-04-send-digital-contact.ts --env dev-lynx \
//     --keychain-id <uuid> --purpose-id <uuid> --key <private-key.pem> \
//     [--company-id 12345678901] [--email contact@example.org]

import { parseArgs } from "node:util";

import { callEservice, mintAccessToken, print, requireArgs, urls } from "./lib.ts";

const { values: args } = parseArgs({
  options: { "company-id": { type: "string" }, email: { type: "string" }, env: { type: "string" }, key: { type: "string" }, "keychain-id": { type: "string" }, "purpose-id": { type: "string" } },
  strict: true,
});
requireArgs(args, ["keychain-id", "purpose-id", "key"]);

const env = urls(args.env);
const { access_token } = await mintAccessToken(env.auth, args["keychain-id"]!, args["purpose-id"]!, args.key!);

// The producer only cross-checks legalIdentifier.notation; the rest just needs
// to be schema-valid.
const body = {
  contactPoint: { hasEmail: args.email ?? "digital.contact@example.org" },
  legalEntity: {
    legalEntityActivity: "01.11.00",
    legalIdentifier: { notation: args["company-id"] ?? "12345678901", schemeName: "Partita Iva", schemeURI: "http://memberstate.ms/VAT" },
    legalName: "Submitted by consumption script",
    registrationDate: "2000-01-01",
  },
};

const response = await callEservice(env.eservice, "/digital-contacts", access_token, { body, method: "POST" });
print(response.body);
