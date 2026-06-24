// POC UC03 — Phase 5, step 3.
//
// Mints an e-service access token for systemSERCLynx's keychain/purpose on
// systemSERCOrion's relay e-service, builds the erd_dispatch carrying the
// sender's message (messageType=Dispatch) and POSTs it to the recipient SERC's
// relay (resolved point-to-point from --recipient-serc). Prints the dispatch and ACK.
//
//   node send-message.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> \
//     --recipient-serc <erdsIdentifier from lookup-recipient-serc> \
//     --recipient-id 01229430085 --subject "Notification" --body "Forwarded message body"

import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

import { postJson } from "../../_shared/eservice-client.ts";
import { mintLynxConsumerToken } from "./accessToken.ts";
import {
  RECIPIENT_SCHEME,
  RELAY_URL_BY_SERC,
  SAMPLE_SENDER_IDENTIFIER,
} from "./paths.ts";

const { values } = parseArgs({
  options: {
    body: { type: "string" },
    "consumer-keychain-id": { type: "string" },
    "purpose-id": { type: "string" },
    "recipient-id": { type: "string" },
    "recipient-serc": { type: "string" },
    subject: { type: "string" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const recipientSerc = values["recipient-serc"];
const recipientId = values["recipient-id"];
const subject = values.subject;
const body = values.body;

if (
  !consumerKeychainId ||
  !purposeId ||
  !recipientSerc ||
  !(recipientSerc in RELAY_URL_BY_SERC) ||
  !recipientId ||
  !subject ||
  !body
) {
  console.error(
    "Usage: node send-message.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --recipient-serc systemSERCLynx|systemSERCOrion --recipient-id <notation> --subject <text> --body <text>",
  );
  process.exit(1);
}

// This script always acts as systemSERCLynx (it mints a Lynx consumer token), so
// the only supported recipient in the POC is systemSERCOrion; relaying to
// systemSERCLynx (the sender's own SERC) is not implemented.
if (recipientSerc === "systemSERCLynx") {
  console.error(
    "recipient-serc systemSERCLynx is not supported: send-message acts as systemSERCLynx and only relays to systemSERCOrion in this POC.",
  );
  process.exit(1);
}

const relayUrl =
  RELAY_URL_BY_SERC[recipientSerc as keyof typeof RELAY_URL_BY_SERC];

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

let ack: unknown;
try {
  const accessToken = await mintLynxConsumerToken(consumerKeychainId, purposeId);
  ack = await postJson(relayUrl, "/relay", accessToken, dispatch);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log("Sent dispatch:");
console.log(JSON.stringify(dispatch, null, 2));
console.log(`\nmessageIdentifier.uuid (pass as --message-id): ${messageId}`);
console.log("\nACK:");
console.log(JSON.stringify(ack, null, 2));
