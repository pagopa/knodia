# POC Use Case 03 — Demo Flow

Step-by-step instructions to run the POC Use Case 03 demo end-to-end. See [POC Use Case 03](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2912092247/POC+Use+Case+03) for the scenario.

Legend: **[UI]** — do it in the node frontend · **[script]** — run from the `scripts/` folder with `node <name>.ts` · **[narration]** — just explain it out loud, nothing to do.

## Prerequisites

- `scripts/seed/seed.sh` must have been run against the environment where the demo will run (e.g. dev/test).
- A user for each organization (`systemSERCLynx`, `systemSERCOrion`, `supervisoryBodyOrion`) must have been created in the env's Cognito user pools, with all roles (technical + administrative — this demo does not cover role-based behaviour), and their username/password handed to the demo runner to log in to the Lynx and Orion UIs.
- The scripts target the local infra by default. To run them against another environment (e.g. dev/test), set the `POC_*` base-URL env vars before running — see `scripts/paths.ts` in this folder for the full list and local defaults, and use that environment's per-knode hosts from `collections/environments/Dev-*.bru` / `Test-*.bru`.

## Phase 1

Organizations: `supervisoryBodyOrion`, `systemSERCOrion`, `systemSERCLynx`

Knodes: `Orion`, `Lynx`

Description: the three POC producers publish the cross-border e-services that make the relay possible — the supervisory body of Orion a **provide-data** e-service to look up which SERC serves a recipient and fetch its metadata, and each SERC a **receive-data** e-service to relay a dispatch (the sender's message, or the delivery evidences).

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `supervisoryBodyOrion` Organization.
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create e-service" to show the e-service creation flow.
4. **[UI]** That was only to show the creation flow — the e-services used by the demo were already created in advance. Open `ERDS Lookup & Metadata - Orion` (provide-data) and show its detail page.
5. **[UI]** _(as `systemSERCOrion`, on Orion)_ Log in as the `systemSERCOrion` Organization and open its `ERDS Relay - Orion` e-service (receive-data); show its detail page.
6. **[UI]** _(as `systemSERCLynx`, on Lynx)_ Log in to the Lynx Knode as the `systemSERCLynx` Organization and open its `ERDS Relay - Lynx` e-service (receive-data); show its detail page.

## Phase 2

Organization: `systemSERCLynx`

Knode: `Lynx`

Description: to look up the recipient's SERC, `systemSERCLynx` must first satisfy the consumption requirements of the supervisory body's provide-data e-service: Agreement, Purpose, Keychain, and Keychain↔Purpose linking.

Steps:

1. **[UI]** Log in to the Lynx Knode as a User of the `systemSERCLynx` Organization.
2. **[UI]** Go to the Consumption > E-services section, search the catalog, and open the **provide-data** e-service (`ERDS Lookup & Metadata - Orion`).
3. **[UI]** Request an Agreement for the e-service.
4. **[UI]** Follow the agreement-activation link shown after creation — it opens on the producer (Orion) Knode — and confirm the activation, so the Agreement becomes Active.
5. **[UI]** Create a Purpose for the E-service.
6. **[script]** Run `node generate-lynx-key.ts` — it prints `systemSERCLynx`'s public key and saves its private key to a fixed path in this folder, read automatically by the later scripts (no key path to pass around).
7. **[UI]** In the Keychains section, create a Consumer Keychain, add yourself as a member, upload the public key printed by `node generate-lynx-key.ts`, and link the Purpose to it.
8. Note the Consumer Keychain id and the Purpose id — they are params for the scripts.

## Phase 3

Organization: `systemSERCLynx`

Knode: `Lynx`

Description: to relay the sender's message to the recipient's SERC, `systemSERCLynx` must also satisfy the consumption requirements of `systemSERCOrion`'s relay e-service. The setup is the same as Phase 2, but for a different e-service.

Steps:

1. **[UI]** Repeat steps 2–5 of Phase 2 for the **relay** e-service (`ERDS Relay - Orion`). When creating its Purpose, select the e-service's predefined Purpose Form option ("Comunicazione tra sistemi di notifica certificata").
2. **[UI]** Link the Purpose to the same Consumer Keychain created in Phase 2.
3. Note the Purpose id — the Consumer Keychain is the same as Phase 2.

## Phase 4

Organization: `systemSERCOrion`

Knode: `Orion`

Description: to relay the delivery evidences back to the sender's SERC, `systemSERCOrion` must satisfy the consumption requirements of `systemSERCLynx`'s relay e-service. The setup is the same as Phase 2, but for a different e-service and consumer organization.

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `systemSERCOrion` Organization and repeat steps 2–7 of Phase 2 for the **relay** e-service (`ERDS Relay - Lynx`) — its activation link opens on the producer (Lynx) Knode, select the same Purpose Form option for its Purpose, and at step 6 run `node generate-orion-key.ts` (which generates `systemSERCOrion`'s own consumer key) instead of `generate-lynx-key.ts`.
2. Note the Consumer Keychain id and the Purpose id.

## Phase 5

Organization: `systemSERCLynx`

Knode: `Lynx`

Description: on a delivery request from one of its users (`senderLynx`), `systemSERCLynx` discovers which SERC serves the recipient through `supervisoryBodyOrion`, then relays the sender's message to that SERC (`systemSERCOrion`).

Steps:

1. **[narration]** A citizen (`senderLynx`) asks `systemSERCLynx` to deliver a certified message to a recipient identified by `01229430085`.
2. **[script]** Run `node lookup-recipient-serc.ts --consumer-keychain-id <id> --purpose-id <id> --recipient-id 01229430085`, using `systemSERCLynx`'s Consumer Keychain and the Purpose id from Phase 2 — the script calls `lookupERDS` then `getERDSMetadata` on `supervisoryBodyOrion` and prints the recipient's `erdsIdentifier` and its relay endpoint URL.
3. **[script]** Run `node send-message.ts --consumer-keychain-id <id> --purpose-id <id> --recipient-serc <erdsIdentifier from step 2> --relay-url <URL from step 2> --recipient-id 01229430085 --subject "Notifica" --body "Testo del messaggio inoltrato"`, using `systemSERCLynx`'s Consumer Keychain and the Purpose id from Phase 3 — the script builds the `erd_dispatch` (`messageType=Dispatch`) and POSTs it directly to the relay URL; it prints the sent dispatch (with its `messageIdentifier.uuid`) and the ACK.
4. **[narration]** `systemSERCOrion` receives the message and makes it available to the recipient (`recipientOrion`); that SERC↔recipient interaction is out of POC scope. Note the `messageIdentifier.uuid` printed by `send-message.ts` — it is a param for the next phase.

## Phase 6

Organization: `systemSERCOrion`

Knode: `Orion`

Description: for the message relayed in Phase 5, `systemSERCOrion` returns the ERDS evidences to the sender's SERC (`systemSERCLynx`) — `ContentConsignment` when the message is made available to the recipient, and `ContentHandover` when the recipient picks it up.

Steps:

1. **[narration]** The recipient's message is made available to, then picked up by, `recipientOrion`.
2. **[script]** Run `node send-handover-evidence.ts --consumer-keychain-id <id> --purpose-id <id> --message-id <uuid> --event ContentConsignment`, using `systemSERCOrion`'s Consumer Keychain and Purpose from Phase 4 and the `messageIdentifier.uuid` from Phase 5 — the script builds the `erd_dispatch` carrying the evidence (`messageType=Receipt`, `eventReason=MessageConsignedToRecipient`) and relays it to `systemSERCLynx`; it prints the evidence and the ACK.
3. **[script]** Run it again with `--event ContentHandover` — the same call carrying the handover evidence (`eventReason=MessageHandoverToRecipient`).
4. **[narration]** `systemSERCLynx` receives the evidences and notifies the sender (`senderLynx`) of the delivery outcome; that SERC↔sender interaction is out of POC scope.
