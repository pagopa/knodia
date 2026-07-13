# POC Use Case 02 — Demo Flow

Step-by-step instructions to run the POC Use Case 02 demo end-to-end. See [POC Use Case 02](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2914353300/POC+Use+Case+02) for the scenario.

Legend: **[UI]** — do it in the node frontend · **[script]** — run from the `scripts/` folder with `node <name>.ts` · **[narration]** — just explain it out loud, nothing to do.

## Prerequisites

- The environment must already be seeded (POC organizations, e-services, and Cognito users). On **dev** and **test** this is already applied — it is not a step you run for the demo; if you're unsure it's in place (or need it on another environment), verify with the infra team.
- Log in to the Lynx and Orion UIs as each organization's seeded Cognito user (both roles — this demo does not cover role-based behaviour): `businessBookletLynx` → `business_booklet_lynx_admin` (Lynx), `constructionCompaniesRegistryOrion` → `construction_companies_registry_orion_admin` (Orion). The usernames are fixed (seeded by `scripts/seed/seed-poc-users.sh`); the password is set at seeding time, so get it from the infra team.
- The scripts target the local infra by default. To run them against another environment (e.g. dev/test), set the `POC_*` base-URL env vars before running — see `scripts/paths.ts` in this folder for the full list and local defaults, and use that environment's per-knode hosts from `collections/environments/Dev-*.bru` / `Test-*.bru`.

## Phase 1

Organization: `businessBookletLynx`

Knode: `Lynx`

Description: the Business Booklet of Lynx publishes a cross-border e-service that lets other domains' Construction Company Registries retrieve information and evidence on companies registered in Lynx.

Steps:

1. **[UI]** Log in to the Lynx Knode as a User of the `businessBookletLynx` Organization (user `business_booklet_lynx_admin`).
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create e-service" to show the e-service creation flow.
4. **[UI]** That was only to show the creation flow — the e-service used by the demo (`Company Information & Evidence - Lynx`) was already created in advance. Open it and show its detail page.

## Phase 2

Organization: `constructionCompaniesRegistryOrion`

Knode: `Orion`

Description: to use the Lynx e-service in its registration process, the Construction Companies Registry of Orion must first satisfy the e-service's consumption requirements: Agreement, Purpose, Keychain, and Keychain↔Purpose linking.

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `constructionCompaniesRegistryOrion` Organization (user `construction_companies_registry_orion_admin`).
2. **[UI]** Go to the Consumption > E-services section, search the catalog, and open the Lynx cross-border e-service (`Company Information & Evidence - Lynx`).
3. **[UI]** Request an Agreement for the e-service.
4. **[UI]** Follow the agreement-activation link shown after creation — it opens on the producer (Lynx) Knode — and confirm the activation, so the Agreement becomes Active.
5. **[UI]** Create a Purpose for the E-service.
6. **[script]** Run `node generate-consumer-key.ts` — it prints the public key for the consumer e-service keychain and saves the private key to a fixed path in this folder, read automatically by the later scripts (no key path to pass around).
7. **[UI]** In the Keychains section, create a Consumer Keychain, add yourself as a member, upload the public key printed by `node generate-consumer-key.ts`, and link the Purpose to it.
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

Organizations: `constructionCompaniesRegistryOrion`, `businessBookletLynx`

Knodes: `Orion`, `Lynx`

Description: the Construction Companies Registry of Orion monitors the Lynx Signal Hub for the e-service. When a signal concerns one of its registered Lynx companies, it re-retrieves that company's evidence from Lynx via the e-service and updates the company's registration in Orion accordingly.

Steps:

1. **[script]** Run `node generate-knode-api-key.ts` — it prints two public keys (one for the producer's, one for the consumer's Knode API keychain) and saves their private keys to fixed paths read by the later scripts.
2. **[UI]** _(producer side, on Lynx)_ In the Keychains section, create a Knode API Keychain for `businessBookletLynx`, add a member, and upload the **producer** public key printed by `node generate-knode-api-key.ts`. Note the keychain id.
3. **[script]** Run `node publish-evidence-update-signal.ts --producer-knode-api-keychain-id <id> --company-id 01229430085` — `businessBookletLynx` changes a company's evidence and publishes the signal to the Lynx Signal Hub.
4. **[UI]** _(consumer side, on Orion)_ In the Keychains section, create a Knode API Keychain for `constructionCompaniesRegistryOrion`, add a member, and upload the **consumer** public key printed by `node generate-knode-api-key.ts`. Note the keychain id.
5. **[script]** Run `node recover-evidence-changes.ts --consumer-knode-api-keychain-id <id> --consumer-keychain-id <id> --purpose-id <id> --company-id 01229430085` — the registry reads the new signal and re-retrieves the company's evidence from Lynx; the script prints the retrieved signal and the evidence (the e-service response).
6. **[narration]** The registry updates the company's registration in Orion accordingly.
