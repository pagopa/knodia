# mock-eservice-e2e-dpop

Exercises the full DPoP access-token flow against the seeded mock DPoP
e-service.

## Run

1. **Step 1 – Get Mock Eservice (DPoP)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `dpop-token-flow` from **step 2** to **step 11** (skip
   step 1 — the eserviceId is already set). Between step 10 and
   step 11, run the signing scripts as described in the
   `dpop-token-flow/README.md`. Step 11 stashes the `access_token`.
3. **Re-sign a fresh DPoP proof** bound to the access token and
   targeting the resource endpoint:

   ```
   pnpm generate-dpop-proof \
     --key $KEYCHAIN_PRIVATE_<RS256|ES256>_KEY_PATH \
     --alg <RS256|ES256> \
     --htm GET \
     --htu https://test.knodia.org/testDpop \
     --ath <access_token-from-step-11>
   ```

   The proof used in step 11 (`htm=POST`, `htu=<token-endpoint>`,
   no `ath`) cannot be reused — the mock-eservice expects a proof
   bound to the access token (`ath`) and matching the request
   method/path (`GET /testDpop`).
4. **Step 2 – Call Mock Eservice (DPoP)** — calls `GET /testDpop`
   with the `access_token` captured by step 11 and the freshly
   re-signed `DPOP_PROOF_JWT` from `collections/.env` →
   expect `200 {status: "ok"}`.
