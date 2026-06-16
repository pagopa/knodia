# POC Use Case 02 — Demo Flow

Step-by-step instructions to run the POC Use Case 02 demo end-to-end. See [POC Use Case 02](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2914353300/POC+Use+Case+02) for the scenario.

Legend: **[UI]** — do it in the node frontend · **[script]** — run from the `scripts/` folder with `node <name>.ts` · **[narration]** — just explain it out loud, nothing to do.

## Prerequisites

- `scripts/seed/seed.sh` must have been run against the environment where the demo will run (e.g. dev/test).
- A user for each organization (`businessBookletLynx`, `constructionCompaniesRegistryOrion`) must have been created in the env's Cognito user pools, with all roles (technical + administrative — this demo does not cover role-based behaviour), and their username/password handed to the demo runner to log in to the Lynx and Orion UIs.
- The scripts target the local infra by default. To run them against another environment (e.g. dev/test), set the `POC_*` base-URL env vars before running — see `scripts/paths.ts` in this folder for the full list and local defaults, and use that environment's per-knode hosts from `collections/environments/Dev-*.bru` / `Test-*.bru`.

## Phase 1

Organization: `businessBookletLynx`
Knode: `Lynx`
Description: the Business Booklet of Lynx publishes a cross-border e-service that lets other domains' Construction Company Registries retrieve information and evidence on companies registered in Lynx.

Steps:

1. **[UI]** Log in to the Lynx Knode as a User of the `businessBookletLynx` Organization.
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create e-service" to show the e-service creation flow.
4. **[UI]** That was only to show the creation flow — the e-service used by the demo (`Company Information & Evidence - Lynx`) was already created in advance. Open it and show its detail page.

## Phase 2

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: to use the Lynx e-service in its registration process, the Construction Companies Registry of Orion must first satisfy the e-service's consumption requirements: Agreement, Purpose, Keychain, and Keychain↔Purpose linking.

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `constructionCompaniesRegistryOrion` Organization.
2. **[UI]** Go to the Consumption > E-services section, search the catalog, and open the Lynx cross-border e-service (`Company Information & Evidence - Lynx`).
3. **[UI]** Request an Agreement for the e-service.
4. **[UI]** Follow the agreement-activation link shown after creation — it opens on the producer (Lynx) Knode — and confirm the activation, so the Agreement becomes Active.
5. **[UI]** Create a Purpose for the E-service.
6. **[script]** Run `node generate-key.ts` — it prints a public key and saves the private key to a fixed path in this folder, which the later scripts read automatically (no key path to pass around).
7. **[UI]** In the Keychains section, create a Consumer Keychain, add yourself as a member, upload the public key printed by `node generate-key.ts`, and link the Purpose to it.
8. Note the Consumer Keychain id and the Purpose id — they are params for the scripts.

## Phase 3

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: on a registration request from a Lynx company, the Construction Companies Registry of Orion retrieves the company's information and evidence from Lynx via the cross-border e-service, then answers the company with the registration outcome.

Steps:

1. **[narration]** A construction company (`companyLynx`) submits a registration request to the registry.
2. **[script]** Run `node retrieve-company-data.ts --consumer-keychain-id <id> --purpose-id <id> --company-id 01229430085` — the registry retrieves the company's information and evidence from Lynx; the script prints the retrieved information and evidence (the e-service responses).
3. **[narration]** The registry answers the company with the registration outcome: confirmed on success, rejected otherwise.

## Phase 4

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of Orion monitors the Lynx Signal Hub for the e-service. When a signal concerns one of its registered Lynx companies, it re-retrieves that company's evidence from Lynx via the e-service and updates the company's registration in Orion accordingly.

Steps:

1. **[UI]** _(producer side, on Lynx)_ In the Keychains section, create a Knode API Keychain for `businessBookletLynx`, add a member, and upload the public key printed by `node generate-key.ts`. Note the keychain id.
2. **[script]** Run `node publish-evidence-update-signal.ts --producer-knode-api-keychain-id <id> --company-id 01229430085` — `businessBookletLynx` changes a company's evidence and publishes the signal to the Lynx Signal Hub.
3. **[UI]** _(consumer side, on Orion)_ In the Keychains section, create a Knode API Keychain for `constructionCompaniesRegistryOrion`, add a member, and upload the public key printed by `node generate-key.ts`. Note the keychain id.
4. **[script]** Run `node recover-evidence-changes.ts --consumer-knode-api-keychain-id <id> --consumer-keychain-id <id> --purpose-id <id> --company-id 01229430085` — the registry reads the new signal and re-retrieves the company's evidence from Lynx; the script prints the retrieved signal and the evidence (the e-service response).
5. **[narration]** The registry updates the company's registration in Orion accordingly.
