// POC UC03 — Phase 5, step 3.
//
// Mints an e-service access token for systemSERCLynx's keychain/purpose on
// systemSERCOrion's relay e-service, builds the erd_dispatch carrying the
// sender's message (messageType=Dispatch) and POSTs it directly to the relay
// URL returned by getERDSMetadata. Prints the sent dispatch and the ACK.
//
//   node send-message.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> \
//     --recipient-serc <erdsIdentifier> --relay-url <url> \
//     --recipient-id 01229430085 --subject "Notifica" --body "Testo del messaggio inoltrato"

import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

import { mintAccessToken, postJson, requirePrivateKey } from "./lib.ts";
import {
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  ORION_AUTHORIZATION_SERVER_URL,
  RECIPIENT_SCHEME,
  SAMPLE_SENDER_IDENTIFIER,
} from "./paths.ts";

const { values } = parseArgs({
  options: {
    body: { type: "string" },
    "consumer-keychain-id": { type: "string" },
    "purpose-id": { type: "string" },
    "recipient-id": { type: "string" },
    "recipient-serc": { type: "string" },
    "relay-url": { type: "string" },
    subject: { type: "string" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const recipientSerc = values["recipient-serc"];
const relayUrl = values["relay-url"];
const recipientId = values["recipient-id"];
const subject = values.subject;
const body = values.body;

if (
  !consumerKeychainId ||
  !purposeId ||
  !recipientSerc ||
  !relayUrl ||
  !recipientId ||
  !subject ||
  !body
) {
  console.error(
    "Usage: node send-message.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --recipient-serc <erdsIdentifier> --relay-url <url> --recipient-id <notation> --subject <text> --body <text>",
  );
  process.exit(1);
}

requirePrivateKey(
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  "Run generate-lynx-key first and upload its public key to the keychain.",
);

const accessToken = await mintAccessToken(
  ORION_AUTHORIZATION_SERVER_URL,
  LYNX_CONSUMER_PRIVATE_KEY_PATH,
  consumerKeychainId,
  purposeId,
);

const messageId = randomUUID();
const dispatch = {
  evidence: {
    eventIdentifier: "SubmissionAcceptance",
    eventReason: "MessageAccepted",
    eventTime: new Date().toISOString(),
    evidenceIdentifier: { erdsIdentifier: recipientSerc, uuid: randomUUID() },
    version: "KNODIAUSECASE",
  },
  relayMetadata: {
    messageIdentifier: { erdsIdentifier: recipientSerc, uuid: messageId },
    messageType: "Dispatch",
    recipientIdentifier: { notation: recipientId, ...RECIPIENT_SCHEME },
    senderIdentifier: SAMPLE_SENDER_IDENTIFIER,
    userContentInformation: "text",
    version: "KNODIAUSECASE",
  },
  userContent: { body, subject },
};

const ack = await postJson(relayUrl, "/relay", accessToken, dispatch);

console.log("Sent dispatch:");
console.log(JSON.stringify(dispatch, null, 2));
console.log(`\nmessageIdentifier.uuid (pass as --message-id): ${messageId}`);
console.log("\nACK:");
console.log(JSON.stringify(ack, null, 2));
