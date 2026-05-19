# mock-eservice-e2e-bearer

Exercises the full access-token flow against the seeded mock e-service.

## Run

1. **Step 1 – Get Mock Eservice (Bearer)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `bearer-token-flow` from **step 2** to **step 11** (skip
   step 1 — the eserviceId is already set). Between step 10 and
   step 11, run the signing script as described in the
   `bearer-token-flow/README.md`.
3. **Step 2 – Get Personal Information (Bearer)** — calls
   `GET /natural-persons/RMNLNR03H12H501Z` with the `access_token`
   captured by step 11 → expect `200 {dateOfBirth: "2003-06-12"}`.
