# mock-eservice-e2e-signal-hub

Exercises the bearer access-token flow against the seeded Signal Hub mock
e-service.

## Rotation

Fiscal codes `RMNLNR03H12H501Z`, `CNTLCC89E26L378K`, `RSSGRG65D48G702L`
have a rotating response. The response to `GET /residence` and the seed
exposed by `/pseudonymization` rotate in sync, and a cronjob pushes the matching `CREATE` / `UPDATE` / `DELETE` signals each period.

| periodId % 3 | `/residence`    | `/pseudonymization` | SignalHub signal |
| ------------ | --------------- | ------------------- | ---------------- |
| 0            | address A (200) | seed A              | CREATE           |
| 1            | address B (200) | seed B              | UPDATE           |
| 2            | 404             | seed C              | DELETE           |


Set `SIGNAL_HUB_SEED_EXPIRE_SECONDS=30` (or similar short value) on mock-eservice and on the cron job to observe the full cycle in a reasonable time frame.

## Run

1. **1 - Get Mock Eservice (Signal Hub Bearer)** — captures the seeded
   `eserviceId` as a Bruno var.
2. Run `bearer-token-flow` from **step 2** to **step 11** (skip
   step 1 — the eserviceId is already set). Between step 10 and
   step 11, run the signing script as described in the
   `bearer-token-flow/README.md`.
3. **Step 2 – Get Residence (Signal Hub Bearer)** — calls
   `GET /natural-persons/RMNLNR03H12H501Z/residence` with the `access_token`
   captured by step 11.
4. **3 - Get Pseudonymization (Signal Hub Bearer)** — calls
   `GET /pseudonymization` with the same `access_token`.
5. Re-run both 3 times across period boundaries to observe the full cycle:
   expect `A → B → 404` for residence and three distinct seeds.
