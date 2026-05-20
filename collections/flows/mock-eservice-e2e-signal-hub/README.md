# mock-eservice-e2e-signal-hub

Exercises the bearer access-token flow against the seeded Signal Hub mock
e-service.

## Rotation

Fiscal codes `RMNLNR03H12H501Z`, `CNTLCC89E26L378K`, `RSSGRG65D48G702L`
have a rotating response. The response to `GET /residence` and the seed
exposed by `/pseudonymization` rotate in sync, and `mock-eservice` writes
the matching `CREATE` / `UPDATE` / `DELETE` signals to the Signal Hub DB
each period from an in-process emitter.

| periodId % 3 | `/residence`    | `/pseudonymization` | SignalHub signal |
| ------------ | --------------- | ------------------- | ---------------- |
| 0            | address A (200) | seed A              | CREATE           |
| 1            | address B (200) | seed B              | UPDATE           |
| 2            | 404             | seed C              | DELETE           |

Set `SEED_EXPIRE_SECONDS=30` (or a similar short value) on mock-eservice
to observe the full cycle in a reasonable time frame.

## Token setup

1. **1 - Get Mock Eservice (Signal Hub Bearer)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `bearer-token-flow` from **step 2** to **step 11** (skip step 1 —
   the eserviceId is already set). Between step 10 and step 11, run the
   signing script as described in the `bearer-token-flow/README.md`.

Steps 2 and 3 below use the `{{access_token}}` Bruno var stashed by
step 11.

## Fetch data and observe rotation

3. **2 - Get Residence (Signal Hub Bearer)** — `GET /natural-persons/RMNLNR03H12H501Z/residence`.
4. **3 - Get Pseudonymization (Signal Hub Bearer)** — `GET /pseudonymization`.
5. Poll the Signal Hub for signals related to the `eserviceId` captured in step 1, wait for new signals.
6. Compute `sha256(<fiscalCode> + <seed from step 4>)` and observe it matches the `object_id` of a `CREATE`/`UPDATE`/`DELETE` signal from step 5. Repeat from step 3 for the next period.

Re-run this in a loop to observe the full cycle: expect
`A → B → 404` on residence and three distinct seeds on pseudonymization.
