# POC Use Case 02 — Demo Flow

Step-by-step instructions to run the POC Use Case 02 demo end-to-end. See [POC Use Case 02](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2914353300/POC+Use+Case+02) for the scenario.

Legend: **[UI]** — do it in the node frontend · **[script]** — run a script from this folder · **[narration]** — just explain it out loud, nothing to do.

## Prerequisites

- `scripts/seed/seed.sh` must have been run against the environment where the demo will run (e.g. dev/test).
- A user for each organization (`businessBookletLynx`, `constructionCompaniesRegistryOrion`) must have been created in the env's Cognito user pools, with all roles (technical + administrative — this demo does not cover role-based behaviour), and their username/password handed to the demo runner to log in to the Lynx and Orion UIs.

## Phase 1

Organization: `businessBookletLynx`
Knode: `Lynx`
Description: the Business Booklet of the Lynx domain publishes a cross-border e-service allowing Construction Company Registries of other domains to retrieve information and evidence about construction companies registered in Lynx.

Steps:

1. **[UI]** Log in to the Lynx Knode as a User of the `businessBookletLynx` Organization.
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create e-service" to show the e-service creation flow.
4. **[UI]** That was only to show the creation flow — the e-service used by the demo (`Company Information & Evidence - Lynx`) was already created in advance. Open it and show its detail page.

## Phase 2

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of the Orion domain wants to implement the retrieval of information and evidence about construction companies registered in Lynx as part of its registration process, by consuming the cross-border e-service published by the Business Booklet of Lynx. In order to do so, it must first satisfy the consumption requirements of the e-service (Agreement, Purpose, Keychain, Keychain<>Purpose linking).

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `constructionCompaniesRegistryOrion` Organization.
2. **[UI]** Go to the Consumption > E-services section, search the catalog, and open the Lynx cross-border e-service.
3. **[UI]** Request an Agreement for the e-service.
4. **[UI]** Follow the agreement-activation link shown after creation — it opens on the producer (Lynx) Knode — and confirm the activation, so the Agreement becomes Active.
5. **[UI]** Create a Purpose for the Agreement.
6. **[script]** Run `generate-key` — it prints a public key and saves the private key to a fixed path in this folder, which the later scripts read automatically (no key path to pass around).
7. **[UI]** In the Keychains section, create a Consumer Keychain, add a member, upload the public key printed by `generate-key`, and link the Purpose to it.
8. Note the Consumer Keychain id and the Purpose id — they are params for the scripts.

## Phase 3

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of the Orion domain receives a registration request from a construction company of the Lynx domain, and is able to retrieve the company's information and evidence from Lynx by consuming the cross-border e-service published by the Business Booklet of Lynx, and answer with a registration confirmation.

Steps:

1. **[narration]** A construction company (`companyLynx`) submits a registration request to the registry.
2. **[script]** Run `retrieve-company-data --consumer-keychain-id <id> --purpose-id <id> --company-id <vat>` — the registry retrieves the company's information and evidence from Lynx.
3. **[narration]** The registry confirms the registration to the company; on failure it returns a nullification.

## Phase 4

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of the Orion domain monitors the Lynx Signal-Hub signals related to the cross-border e-service published by the Business Booklet of Lynx. A new signal is related to one of the Lynx companies registered in Orion, the Construction Companies Registry of the Orion domain retrieves the company's updated information and evidence from Lynx by consuming the cross-border e-service published by the Business Booklet of Lynx, and updates the company's registration information in Orion accordingly.

Steps:

1. **[UI]** _(producer side, on Lynx)_ In the Keychains section, create a Knode API Keychain for `businessBookletLynx`, add a member, and upload the public key printed by `generate-key`. Note its id.
2. **[script]** Run `publish-evidence-update-signal --producer-knode-api-keychain-id <id> --company-id <vat>` — `businessBookletLynx` changes a company's evidence and publishes the signal to the Lynx Signal Hub.
3. **[UI]** _(consumer side, on Orion)_ In the Keychains section, create a Knode API Keychain for `constructionCompaniesRegistryOrion`, add a member, and upload the public key printed by `generate-key`. Note its id.
4. **[script]** Run `recover-evidence-changes --consumer-knode-api-keychain-id <id> --consumer-keychain-id <id> --purpose-id <id> --company-id <vat>` — the registry reads the new signal and re-retrieves the company's evidence from Lynx.
5. **[narration]** The registry updates the company's registration in Orion accordingly.
