# POC Use Case 01 — Demo Flow

Step-by-step instructions to run the POC Use Case 01 demo end-to-end. See [POC Use Case 01](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2912682081/POC+Use+Case+01) for the scenario.

Legend: **[UI]** — do it in the node frontend · **[script]** — run a script from this folder · **[narration]** — just explain it out loud, nothing to do.

The use case has two cross-border e-services published by `studentRegistryLynx`:

- **provide-data** `getQualifications` — retrieve the qualifications held by a student.
- **receive-data** `setQualification` — register a new qualification for a student.

Each e-service has its own Agreement, Purpose and Consumer Keychain on the consumer side.

## Prerequisites

- `scripts/seed/seed.sh` must have been run against the environment where the demo will run (e.g. dev/test).
- A user for each organization (`studentRegistryLynx`, `academyOrion`) must have been created in the env's Cognito user pools, with all roles (technical + administrative — this demo does not cover role-based behaviour), and their username/password handed to the demo runner to log in to the Lynx and Orion UIs.

## Phase 1

Organization: `studentRegistryLynx`
Knode: `Lynx`
Description: the national Student Registry of Lynx publishes two cross-border e-services that let tertiary-education institutes from other domains retrieve a student's qualifications and register a newly conferred one.

Steps:

1. **[UI]** Log in to the Lynx Knode as a User of the `studentRegistryLynx` Organization.
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create e-service" to show the e-service creation flow.
4. **[UI]** That was only to show the creation flow — the two e-services used by the demo (`Student Qualifications - Lynx`, provide-data; `Student Qualification Registration - Lynx`, receive-data) were already created in advance. Open each and show its detail page; on the receive-data one, show its Purpose Form option.

## Phase 2

Organization: `academyOrion`
Knode: `Orion`
Description: to use the Lynx e-services, the Academy of Orion (holder of the `trainingInstitutes` attribute) must first satisfy each e-service's consumption requirements: Agreement, Purpose, Keychain, and Keychain↔Purpose linking. This is done once per e-service (provide-data and receive-data).

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `academyOrion` Organization.
2. **[script]** Run `node generate-key.ts` — it prints a public key and saves the private key to a fixed path in this folder, which the later scripts read automatically (no key path to pass around). The same public key is used for both Consumer Keychains below.
3. **[UI]** Go to the Consumption > E-services section, search the catalog, and open the **provide-data** e-service (`Student Qualifications - Lynx`).
4. **[UI]** Request an Agreement for it, follow the agreement-activation link shown after creation — it opens on the producer (Lynx) Knode — and confirm the activation, so the Agreement becomes Active.
5. **[UI]** Create a Purpose for the Agreement, then create a Consumer Keychain, add a member, upload the public key printed by `node generate-key.ts`, and link the Purpose to it.
6. Note this (Consumer Keychain id, Purpose id) pair — it is for the **provide-data** scripts.
7. **[UI]** Repeat steps 3–5 for the **receive-data** e-service (`Student Qualification Registration - Lynx`). When creating its Purpose, select the e-service's predefined Purpose Form option ("Registration of a qualification obtained abroad").
8. Note this second (Consumer Keychain id, Purpose id) pair — it is for the **receive-data** script.

## Phase 3

Organization: `academyOrion`
Knode: `Orion`
Description: on an admission application from a student, the Academy of Orion retrieves the student's qualifications from Lynx via the provide-data e-service [OBJECTIVE_01].

Steps:

1. **[narration]** A student (`citizenLynx`) submits an admission application to the Academy.
2. **[script]** Run `node retrieve-qualifications.ts --consumer-keychain-id <id> --purpose-id <id> --student-id 00132423` (optionally `--iscedf-code 06`), using the **provide-data** pair from Phase 2 — the Academy retrieves the student's qualifications from Lynx; the script prints them (the e-service response).
3. **[narration]** The Academy uses the retrieved qualifications to evaluate the admission.

## Phase 4

Organization: `academyOrion`
Knode: `Orion`
Description: once the student completes a training programme at the Academy and is awarded a new qualification, the Academy registers it back in the Lynx student registry via the receive-data e-service [OBJECTIVE_02].

Steps:

1. **[narration]** The student completes a training programme at the Academy and is awarded a new qualification.
2. **[script]** Run `node set-qualification.ts --consumer-keychain-id <id> --purpose-id <id> --student-id 00132423`, using the **receive-data** pair from Phase 2 — the Academy registers the new qualification on Lynx; the script prints the qualification and the acknowledgement (the e-service response). Use `--title`, `--eqf-level`, `--iscedf-code` and `--publisher-legal-name` to change the registered qualification.
3. **[script]** Run `node retrieve-qualifications.ts` again with the **provide-data** pair — the newly registered qualification now appears alongside the original one.
4. **[narration]** The new qualification is now registered in the national student registry of Lynx.
