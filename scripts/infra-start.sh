#!/bin/bash

# --wait exits 1 when init containers (flyway, debezium-setup, etc.) exit,
# even with exit code 0. This is expected, so we suppress it.
# See: https://github.com/docker/compose/issues/10596.
docker compose -f docker/compose.yaml up -d --wait || true

# Generate local dev tokens (ui-session + internal) for Bruno collections
pnpm generate-all-tokens > /dev/null
