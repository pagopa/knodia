// POC UC03 — Phase 6.
//
// Mints an e-service access token for systemSERCOrion's keychain/purpose on
// systemSERCLynx's relay e-service, builds the erd_dispatch carrying a delivery
// evidence (messageType=Receipt) and relays it to systemSERCLynx. Prints the
// evidence and the ACK.
//
// Only the events exchanged between SERCs are accepted: the consignment-attempt
// result (RelayAcceptance | RelayRejection | RelayFailure) and the handover
// result (ContentHandover | ContentHandoverFailure).
//
//   node send-handover-evidence.ts \
//     --consumer-keychain-id <uuid> --purpose-id <uuid> \
//     --message-id <uuid> \
//     --event RelayAcceptance|RelayRejection|RelayFailure|ContentHandover|ContentHandoverFailure

import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

import { mintAccessToken, postJson, requirePrivateKey } from "./lib.ts";
import {
  LYNX_AUTHORIZATION_SERVER_URL,
  LYNX_RELAY_URL,
  ORION_CONSUMER_PRIVATE_KEY_PATH,
  RECIPIENT_SCHEME,
  SAMPLE_RECIPIENT_ID,
  SAMPLE_SENDER_IDENTIFIER,
} from "./paths.ts";

// Each evidence event maps to exactly one reason (def-page constraint). Only the
// events relayed between SERCs are offered: the consignment-attempt result and
// the handover result.
const EVENT_REASONS = {
  ContentHandover: "MessageHandoverToRecipient",
  ContentHandoverFailure: "MessageTypeNotAcceptedByRecipient",
  RelayAcceptance: "MessageSuccessfullyRelayed",
  RelayFailure: "UnknownRecipient",
  RelayRejection: "MessageRejected",
} as const;

const { values } = parseArgs({
  options: {
    "consumer-keychain-id": { type: "string" },
    event: { type: "string" },
    "message-id": { type: "string" },
    "purpose-id": { type: "string" },
  },
  strict: true,
});

const consumerKeychainId = values["consumer-keychain-id"];
const purposeId = values["purpose-id"];
const messageId = values["message-id"];
const event = values.event;

if (
  !consumerKeychainId ||
  !purposeId ||
  !messageId ||
  !event ||
  !(event in EVENT_REASONS)
) {
  console.error(
    "Usage: node send-handover-evidence.ts --consumer-keychain-id <uuid> --purpose-id <uuid> --message-id <uuid> --event RelayAcceptance|RelayRejection|RelayFailure|ContentHandover|ContentHandoverFailure",
  );
  process.exit(1);
}

const eventIdentifier = event as keyof typeof EVENT_REASONS;

requirePrivateKey(
  ORION_CONSUMER_PRIVATE_KEY_PATH,
  "Run generate-orion-key first and upload its public key to the keychain.",
);

const accessToken = await mintAccessToken(
  LYNX_AUTHORIZATION_SERVER_URL,
  ORION_CONSUMER_PRIVATE_KEY_PATH,
  consumerKeychainId,
  purposeId,
);

const dispatch = {
  evidence: {
    eventIdentifier,
    eventReason: EVENT_REASONS[eventIdentifier],
    eventTime: new Date().toISOString(),
    evidenceIdentifier: { erdsIdentifier: "systemSERCOrion", uuid: randomUUID() },
    version: "KNODIAUSECASE",
  },
  relayMetadata: {
    messageIdentifier: { erdsIdentifier: "systemSERCOrion", uuid: messageId },
    messageType: "Receipt",
    recipientIdentifier: { notation: SAMPLE_RECIPIENT_ID, ...RECIPIENT_SCHEME },
    senderIdentifier: SAMPLE_SENDER_IDENTIFIER,
    version: "KNODIAUSECASE",
  },
};

const ack = await postJson(LYNX_RELAY_URL, "/relay", accessToken, dispatch);

console.log(`Sent ${eventIdentifier} evidence for message ${messageId}:`);
console.log(JSON.stringify(dispatch, null, 2));
console.log("\nACK:");
console.log(JSON.stringify(ack, null, 2));
