# Docker Compose files

## `compose.yaml`: single-node infrastructure

Runs only the shared infrastructure services needed for local development: PostgreSQL, Kafka, Debezium, MinIO, pgAdmin, Kafka UI, and supporting init containers (Flyway migrations, readmodel seed, etc.).

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
