# mock-eservice-e2e-async-consumption

Exercises the full access-token flow against the seeded mock e-service.

## Run

1. **Step 1 – Get Mock Eservice (Async Consumption Bearer)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `bearer-token-flow` from **step 2** to **step 11** (skip
   step 1 — the eserviceId is already set). Between step 10 and
   step 11, run the signing script as described in the
   `bearer-token-flow/README.md`.
3. **Step 2 – Request Company Addresses (Async Consumption Bearer)** — calls
   `POST /legal-entities/address-requests` with the `access_token`
   captured by step 11 → expect `200`.
