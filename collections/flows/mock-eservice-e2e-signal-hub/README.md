# mock-eservice-e2e-signal-hub

Exercises the bearer access-token flow against the seeded Signal Hub mock
e-service.

## Rotation

Fiscal codes `RMNLNR03H12H501Z`, `CNTLCC89E26L378K`, `RSSGRG65D48G702L`
have a rotating response. The response to `GET /residence` and the seed
exposed by `/natural-persons/pseudonymization` rotate in sync, and `mock-eservice` writes
the matching `CREATE` / `UPDATE` / `DELETE` signals to the Signal Hub DB
each period from an in-process emitter.

| periodId % 3 | `/residence`    | `/natural-persons/pseudonymization` | SignalHub signal |
| ------------ | --------------- | ------------------- | ---------------- |
| 0            | address A (200) | seed A              | CREATE           |
| 1            | address B (200) | seed B              | UPDATE           |
| 2            | 404             | seed C              | DELETE           |

Set `SIGNAL_HUB_SEED_EXPIRE_SECONDS=30` (or a similar short value) on
mock-eservice to observe the full cycle in a reasonable time frame.

## Token setup

1. **1 - Get Mock Eservice (Signal Hub Bearer)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `bearer-token-flow` from **step 2** to **step 11** (skip step 1 —
   the eserviceId is already set). Between step 10 and step 11, run the
   signing script as described in the `bearer-token-flow/README.md`.

Steps 2 and 3 below use the `{{access_token}}` Bruno var stashed by
step 11.

Step 4 (Pull Signals) authenticates with a Knode API token (`knode-api-token`)
instead — obtained the same way as the bearer token above: run the
`knode-api-token-flow`, which sets up a Knode API keychain, signs a Knode API
client assertion (`pnpm generate-client-assertion --knodeId <Orion|Lynx> …`),
and exchanges it at the authorization server `/knodeApiToken` endpoint (see
`knode-api-token-flow/README.md`). Provide the returned token to step 4 either
by setting `KNODE_API_JWT` in `collections/.env` or with
`--env-var knode-api-token='<token>'`.

## Fetch data and observe rotation

3. **2 - Get Residence (Signal Hub Bearer)** — `GET /natural-persons/RMNLNR03H12H501Z/residence`.
4. **3 - Get Residence Pseudonymization (Signal Hub Bearer)** — `GET /natural-persons/pseudonymization`.
5. **4 - Pull Signals (Signal Hub)** — `GET {{host-signal-hub}}/signals/{{eserviceId}}` (authenticated with `knode-api-token`). Re-run until the signals for the current period appear.
6. Compute `sha256(<fiscalCode> + <seed from step 4>)` and observe it matches the `object_id` of a `CREATE`/`UPDATE`/`DELETE` signal from step 5. Repeat from step 3 for the next period.

Re-run this in a loop to observe the full cycle: expect
`A → B → 404` on residence and three distinct seeds on pseudonymization.
