# POC Use Case 03 — Demo Flow

Step-by-step instructions to run the POC Use Case 03 demo end-to-end. See [POC Use Case 03](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2912092247/POC+Use+Case+03) for the scenario.

Legend: **[UI]** — do it in the node frontend · **[script]** — run a script from this folder with `node <name>.ts` · **[narration]** — just explain it out loud, nothing to do.

## Prerequisites

- `scripts/seed/seed.sh` must have been run against the environment where the demo will run (e.g. dev/test).
- A user for each organization (`systemSERCLynx`, `systemSERCOrion`, `supervisoryBodyOrion`) must have been created in the env's Cognito user pools, with all roles (technical + administrative — this demo does not cover role-based behaviour), and their username/password handed to the demo runner to log in to the Lynx and Orion UIs.
- The scripts target the local infra by default. To run them against another environment (e.g. dev/test), set the `POC_*` base-URL env vars before running — see `scripts/paths.ts` in this folder for the full list and local defaults, and use that environment's per-knode hosts from `collections/environments/Dev-*.bru` / `Test-*.bru`.

## Phase 1

Organizations: `supervisoryBodyOrion` (Orion), `systemSERCOrion` (Orion), `systemSERCLynx` (Lynx)
Description: the three POC organizations publish the cross-border e-services that make the relay possible. The supervisory body of Orion publishes a **provide-data** e-service to look up which SERC serves a recipient and fetch that SERC's metadata; each SERC publishes a **receive-data** e-service to relay a dispatch (the sender's message, or the delivery evidences).

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `supervisoryBodyOrion` Organization.
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create e-service" to show the e-service creation flow.
4. **[UI]** That was only to show the creation flow — the e-services used by the demo were already created in advance. Open `ERDS Lookup & Metadata - Orion` (provide-data, `supervisoryBodyOrion`) and show its detail page.
5. **[UI]** Log in to the Orion Knode as a User of the `systemSERCOrion` Organization and open its `ERDS Relay - Orion` e-service (receive-data); show its detail page.
6. **[UI]** Log in to the Lynx Knode as a User of the `systemSERCLynx` Organization and open its `ERDS Relay - Lynx` e-service (receive-data); show its detail page.

## Phase 2

Organizations: `systemSERCLynx` (Lynx), `systemSERCOrion` (Orion)
Description: before they can call each other's e-services, the SERCs must satisfy each e-service's consumption requirements (Agreement, Purpose, Keychain, and Keychain↔Purpose linking). The demo needs three consumption chains:

- **A.** `systemSERCLynx` → `supervisoryBodyOrion` provide-data (to look up the recipient's SERC)
- **B.** `systemSERCLynx` → `systemSERCOrion` relay (to send the message)
- **C.** `systemSERCOrion` → `systemSERCLynx` relay (to return the evidences)

Steps:

1. **[script]** Run `node generate-key.ts` — it prints a public key and saves the private key to a fixed path in this folder, read automatically by the later scripts (no key path to pass around). Run it once per consuming organization (`systemSERCLynx`, `systemSERCOrion`); each run overwrites that org's key file, so generate and use one org's chains before moving to the next, or keep the printed keys aside.
2. **[UI]** _(chain A — on Lynx, as `systemSERCLynx`)_ In Consumption > E-services, search the catalog and open the Orion provide-data e-service (`ERDS Lookup & Metadata - Orion`). Request an Agreement, then follow the activation link (it opens on the producer, Orion) and confirm the activation so the Agreement becomes Active. Create a Purpose for it. In Keychains, create a Consumer Keychain, add a member, upload the public key from step 1, and link the Purpose to it.
3. **[UI]** _(chain B — on Lynx, as `systemSERCLynx`)_ Repeat the agreement/purpose flow for the Orion relay e-service (`ERDS Relay - Orion`). When creating its Purpose, select the e-service's predefined Purpose Form option ("Comunicazione tra sistemi di notifica certificata"). Link this Purpose to the **same** Consumer Keychain created in step 2.
4. **[UI]** _(chain C — on Orion, as `systemSERCOrion`)_ Repeat the agreement/purpose flow for the Lynx relay e-service (`ERDS Relay - Lynx`), selecting the same Purpose Form option. Create a Consumer Keychain for `systemSERCOrion`, add a member, upload its public key from step 1, and link the Purpose to it.
5. Note the Consumer Keychain ids and the Purpose ids — they are params for the scripts: for `systemSERCLynx` one keychain with two purposes (lookup, relay-to-Orion); for `systemSERCOrion` one keychain with one purpose (relay-to-Lynx).

## Phase 3

Organization: `systemSERCLynx`
Knode: `Lynx`
Description: on a delivery request from one of its users (`senderLynx`), `systemSERCLynx` discovers which SERC serves the recipient through `supervisoryBodyOrion`, then relays the sender's message to that SERC (`systemSERCOrion`). This is OBJECTIVE_01. [narration] the sender↔SERC interaction is out of POC scope.

Steps:

1. **[narration]** A citizen (`senderLynx`) asks `systemSERCLynx` to deliver a certified message to a recipient identified by `01229430085`.
2. **[script]** Run `node lookup-and-send-message.ts --consumer-keychain-id <id> --lookup-purpose-id <id> --relay-purpose-id <id> --recipient-id 01229430085 --subject "Notifica" --body "Testo del messaggio inoltrato"`, using `systemSERCLynx`'s keychain and the two purposes from Phase 2 (chains A and B). The script: looks up the recipient's SERC (`lookupERDS` → `erdsIdentifier`), fetches that SERC's metadata (`getERDSMetadata` → `knodeId`/`eserviceId`), builds the `erd_dispatch` (`messageType=Dispatch`) and relays it to `systemSERCOrion`'s relay e-service; it prints the resolved metadata, the sent dispatch (including its `messageIdentifier.uuid`), and the ACK.
3. **[narration]** `systemSERCOrion` receives the message and makes it available to the recipient (`recipientOrion`); that SERC↔recipient interaction is out of POC scope. Note the `messageIdentifier.uuid` printed by the script — it is a param for the next phase.

## Phase 4

Organization: `systemSERCOrion`
Knode: `Orion`
Description: for the message relayed in Phase 3, `systemSERCOrion` returns the ERDS evidences to the sender's SERC (`systemSERCLynx`) — `ContentConsignment` when the message is made available to the recipient, and `ContentHandover` when the recipient picks it up. This is OBJECTIVE_02.

Steps:

1. **[narration]** The recipient's message is made available to, then picked up by, `recipientOrion`.
2. **[script]** Run `node send-handover-evidence.ts --consumer-keychain-id <id> --purpose-id <id> --message-id <uuid> --event ContentConsignment`, using `systemSERCOrion`'s keychain and purpose from Phase 2 (chain C) and the `messageIdentifier.uuid` printed in Phase 3. The script builds the `erd_dispatch` carrying the evidence (`messageType=Receipt`, `eventIdentifier=ContentConsignment`, `eventReason=MessageConsignedToRecipient`) and relays it to `systemSERCLynx`'s relay e-service; it prints the evidence and the ACK.
3. **[script]** Run it again with `--event ContentHandover` — the same call carrying the handover evidence (`eventReason=MessageHandoverToRecipient`).
4. **[narration]** `systemSERCLynx` receives the evidences and notifies the sender (`senderLynx`) of the delivery outcome; that SERC↔sender interaction is out of POC scope.
