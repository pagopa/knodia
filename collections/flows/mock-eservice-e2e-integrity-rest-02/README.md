# mock-eservice-e2e-integrity-rest-02

Exercises the full access-token flow against the seeded mock e-service.

## Run

1. **Step 1 – Get Mock Eservice (Integrity REST 02 Bearer)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `bearer-token-flow` from **step 2** to **step 11** (skip
   step 1 — the eserviceId is already set). Between step 10 and
   step 11, run the signing script as described in the
   `bearer-token-flow/README.md`.
3. **Step 2 – Get Company Address (Bearer)** — calls
   `GET /legal-entities/12345678901/address` with the `access_token`
   captured by step 11 → expect `200` with `Knodia-JWT-Signature` and
   `Digest` headers. Stores the decoded JWT as `integrity_rest_02_signature_jwt`.
4. **Step 3 – Get Producer Key (Integrity REST 02)** — reads the `kid`
   from `integrity_rest_02_signature_jwt`, calls
   `GET /producerKeys/:kid` on the keychain-process → expect `200`.
   Verifies that the `signed_headers` in the JWT payload match the
   `Digest`, `Content-Type`, and (if present) `Content-Encoding`
   response headers from step 2.
