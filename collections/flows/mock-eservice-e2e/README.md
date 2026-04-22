# mock-eservice-e2e

Exercises the full access-token flow against the seeded mock e-service.

## Run

1. **Step 1 – Get Mock Eservice** — captures the seeded `eserviceId` as
   a Bruno var.
2. Run `client-assertion-flow` from **step 3** to **step 12** (skip
   step 1 and step 2 — the eserviceId is already set). Between step 11
   and step 12, run the signing script as described in the
   `client-assertion-flow/README.md`.
3. **Step 2 – Call Mock Eservice** — calls `GET /test` with the
   `access_token` captured by step 12 → expect `200 {status: "ok"}`.
