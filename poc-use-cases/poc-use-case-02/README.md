# POC Use Case 02 — Demo Flow

Step-by-step instructions to demonstrate [POC Use Case 02](https://pagopa.atlassian.net/wiki/spaces/IT/pages/2914353300/POC+Use+Case+02) end-to-end.

The phases follow the *Interaction Flow* diagram on the use case page: Phases 1–3 cover the *submit registration request* path, Phase 4 the *recovery of evidence changes* path. The `companyLynx` ↔ registry interactions (request, confirmation, nullification) and the registry's `verify scope` / `verify evidence` gates are **narrated only** — they are not implemented in the POC.

## Conventions

- `[UI]` — performed in a node frontend.
- `[scripting]` — runs a dedicated script from `poc-use-cases/poc-use-case-02/scripts/` (to be implemented). Each script wraps the existing repo scripts (`generate-client-assertion`, token requests, e-service / Signal Hub calls) and takes the IDs of the UI-created entities as params, so the use case folder is self-contained.
- `[narration]` — described out loud only; nothing is implemented (the dashed boxes and verify gates in the diagram).

## Prerequisites

- `scripts/seed/seed.sh` must have been run against the environment where the demo will run (e.g. dev/test).
- A user for each organization (`businessBookletLynx`, `constructionCompaniesRegistryOrion`) must have been created in the env's Cognito user pools, with all roles (technical + administrative — this demo does not cover role-based behaviour), and their username/password handed to the demo runner to log in to the Lynx and Orion UIs.

## Phase 1

Organization: `businessBookletLynx`
Knode: `Lynx`
Description: the Business Booklet of the Lynx domain publishes a Cross-border E-Service allowing Construction Company Registries of other domains to retrieve information and evidence about construction companies registered in Lynx.

Steps:

1. **[UI]** Log in to the Lynx Knode as a User of the `businessBookletLynx` Organization.
2. **[UI]** Go to the Production > E-services section.
3. **[UI]** Click "Create E-service" to demonstrate the E-service creation flow.
4. **[UI]** That was just to demonstrate the creation flow; the correct E-service was already created in advance by the seed. Open the right E-service (name TBD) and show its details: the `getCompanyInformation` / `getEvidences` operations, Consumer Requirements = the `companiesRegistries` attribute, category `organization.private_company.construction_activity`, and Signal Hub enabled.
5. **[UI]** Create a Knode API Keychain for `businessBookletLynx` (used in Phase 4 to publish evidence-change signals): add a member and upload a public key. Note its ID (`producerKnodeApiKeychainId`).

## Phase 2

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of the Orion domain wants to implement the retrieval of information and evidence about construction companies registered in Lynx as part of its registration process, by consuming the Cross-border E-Service published by the Business Booklet of Lynx. In order to do so, it must first satisfy the consumption requirements of the Cross-border E-Service (Agreement, Purpose, Keychain, Keychain<>Purpose linking).

Steps:

1. **[UI]** Log in to the Orion Knode as a User of the `constructionCompaniesRegistryOrion` Organization.
2. **[UI]** Go to the Consumption > E-services section and open the Lynx Cross-border E-Service from the catalogue.
3. **[UI]** Create an Agreement for the E-service. It can be granted because the Organization holds the `companiesRegistries` attribute, which satisfies the E-service's Consumer Requirements.
4. **[UI]** _(Lynx side)_ As a `businessBookletLynx` operator, confirm the Agreement — the Lynx producer E-service has operator confirmation enabled — so it becomes `Active`.
5. **[UI]** Create a Purpose for the Agreement.
6. **[UI]** Create a Consumer Keychain, add a member, upload a public key, and link the Purpose to the keychain.
7. **[UI]** Create a Knode API Keychain (used in Phase 4 to pull signals): add a member and upload a public key.

Record `eserviceId`, `agreementId`, `purposeId`, `consumerKeychainId` and `consumerKnodeApiKeychainId` — they are the params for the Phase 3 / 4 scripts.

## Phase 3

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of the Orion domain receives a registration request from a construction company of the Lynx domain, and is able to retrieve the company's information and evidence from Lynx by consuming the Cross-border E-Service published by the Business Booklet of Lynx, and answer with a registration confirmation.

Steps:

1. **[narration]** A construction company (`companyLynx`) submits a registration request to the registry (`submit request` → `receive request`). The demo runner starts the script below.
2. **[scripting]** Run `submit-registration-request` (params: `consumerKeychainId`, `purposeId`, `uidCompany`). It obtains a Lynx access token and calls `getCompanyInformation(uidCompany)`.
   - _Expected:_ `200` with the company `legal_entity` data.
3. **[narration]** The registry verifies the scope (`verify scope`) — narrated OK. On KO it would return a nullification to `companyLynx`.
4. **[scripting]** The same script then calls `getEvidences(uidCompany)`.
   - _Expected:_ `200` with the `evidence` list.
5. **[narration]** The registry verifies the evidence (`verify evidence`) — narrated OK — and would return a registration confirmation to `companyLynx` (`receive confirmation`). On KO, a nullification.

## Phase 4

Organization: `constructionCompaniesRegistryOrion`
Knode: `Orion`
Description: the Construction Companies Registry of the Orion domain monitors the Lynx Signal-Hub signals related to the Cross-border E-Service published by the Business Booklet of Lynx. A new signal is related to one of the Lynx companies registered in Orion, the Construction Companies Registry of the Orion domain retrieves the company's updated information and evidence from Lynx by consuming the Cross-border E-Service published by the Business Booklet of Lynx, and updates the company's registration information in Orion accordingly.

Steps:

1. **[scripting]** _(producer side)_ Run `publish-evidence-update-signal` (params: `producerKnodeApiKeychainId`, `eserviceId`, `uidCompany`). It simulates `businessBookletLynx` changing a company's evidence and publishing the matching signal to the Lynx Signal Hub (`company evidence updates` → `submit updates company signal`).
   - _Expected:_ the signal is accepted by the Lynx Signal Hub.
2. **[scripting]** _(consumer side)_ Run `recover-evidence-changes` (params: `consumerKnodeApiKeychainId`, `consumerKeychainId`, `purposeId`, `eserviceId`, `uidCompany`). It pulls the signals from the Lynx Signal Hub (`updates company signal recover`); on a signal for a monitored company it re-fetches `getEvidences(uidCompany)` (`company evidence recover`).
   - _Expected:_ the new signal appears and the re-fetched evidence reflects the change.
3. **[narration]** The registry verifies the evidence (`verify evidence`) — narrated OK — and updates the company's registration in Orion accordingly.

## Scripts to implement

Under `poc-use-cases/poc-use-case-02/scripts/` (defined in detail when implementing the corresponding work items):

- `submit-registration-request` — params: `consumerKeychainId`, `purposeId`, `uidCompany`. Signs a client assertion, gets a Lynx access token, calls `getCompanyInformation` then `getEvidences`.
- `publish-evidence-update-signal` — params: `producerKnodeApiKeychainId`, `eserviceId`, `uidCompany`. Pushes an evidence-change signal to the Lynx Signal Hub.
- `recover-evidence-changes` — params: `consumerKnodeApiKeychainId`, `consumerKeychainId`, `purposeId`, `eserviceId`, `uidCompany`. Pulls signals from the Lynx Signal Hub and re-fetches `getEvidences`.

Each wraps the existing repo scripts (`pnpm generate-client-assertion`, token endpoints, e-service / Signal Hub calls).

## To finalize during implementation

- Seeded E-service name and the exact endpoint paths / params for `getCompanyInformation` / `getEvidences`.
- Signal content for `evidence` (`objectType` / `objectId`) and how the producer publishes it (see the "POC con Signal Hub" note in the implementation plan).
