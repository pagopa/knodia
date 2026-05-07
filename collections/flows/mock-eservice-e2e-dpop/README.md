# mock-eservice-e2e-dpop

Exercises the full DPoP access-token flow against the seeded mock DPoP
e-service.

## Run

1. **Step 1 – Get Mock Eservice** — captures the seeded `eserviceId` as
   a Bruno var.
2. Run `dpop-token-flow` from **step 2** to **step 11** (skip
   step 1 — the eserviceId is already set). Between step 10 and
   step 11, run the signing scripts as described in the
   `dpop-token-flow/README.md`.
3. **Step 2 – Call Mock Eservice** — calls `GET /testDpop` with the
   `access_token` captured by step 11 and the `DPOP_PROOF_JWT` from
   `collections/.env` → expect `200 {status: "ok"}`.
