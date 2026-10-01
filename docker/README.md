# Docker Compose files

## `compose.yaml`: single-node infrastructure

Runs only the shared infrastructure services needed for local development: PostgreSQL, Kafka, Debezium, RustFS, pgAdmin, Kafka UI, and supporting init containers (Flyway migrations, readmodel + S3 seed, etc.).

Application services (process, readmodel-writer, BFF, frontend) are started separately via `pnpm dev` in their respective packages.

```bash
pnpm infra:start                # start infrastructure (+ generate local dev tokens)
pnpm infra:stop                 # stop containers (preserves volumes)
pnpm infra:destroy              # stop and remove containers (volumes are preserved)
pnpm infra:destroy -- --volumes # stop and remove containers and volumes (useful to recover from Debezium/event-consumption failures caused by stale state)
```

## `compose.multinode.yaml`: multi-node environment

Runs the full platform as two independent knodes (**Orion** and **Lynx**), each with its own set of application services (process, readmodel-writer, BFF, frontend) plus the shared infrastructure.

Useful for testing cross-knode interactions (k2k-gateway, remote-resources-manager).

```bash
pnpm multinode:start    # build, start, and health-check all services
pnpm multinode:stop     # stop containers (preserves volumes)
pnpm multinode:destroy  # stop and remove containers, remove volumes
```

### Building images one at a time

`pnpm multinode:start` builds all images in parallel by default. On hosts that run out of memory under the parallel build, set `SEQUENTIAL_BUILD=1` to build one image at a time:

```bash
SEQUENTIAL_BUILD=1 pnpm multinode:start
```

### Rebuilding individual services

To rebuild and restart specific services without touching the rest of the stack:

```bash
docker compose -f docker/compose.multinode.yaml build SERVICE...
docker compose -f docker/compose.multinode.yaml up -d --no-deps SERVICE...
```

For example, to rebuild only the Orion BFF and frontend:

```bash
docker compose -f docker/compose.multinode.yaml build bff-orion frontend-orion
docker compose -f docker/compose.multinode.yaml up -d --no-deps bff-orion frontend-orion
```

### On-demand jobs: suspended-users notifier

`signup-suspended-users-notifier` is a one-shot batch job (it emails the DPO the list of suspended users, then exits), so it is behind the `on-demand` profile and does **not** start with `pnpm multinode:start`. Run it by hand once the stack is up:

```bash
docker compose -f docker/compose.multinode.yaml run --rm signup-suspended-users-notifier
```

`run` starts its dependencies and surfaces the job's exit code, so a failed run is visible instead of being swallowed by the startup health-check. The image is built on first invocation (it is skipped by the `multinode:start` build because it is not in the default profile).
