#!/bin/bash

# --wait exits 1 when init containers (flyway, debezium-setup, etc.) exit,
# even with exit code 0. This is expected, so we suppress it.
# See: https://github.com/docker/compose/issues/10596.
docker compose -f docker/compose.yaml up -d --wait || true

# Only generate tokens if the infrastructure services are actually running
if docker compose -f docker/compose.yaml ps --status running --quiet | grep -q .; then
  pnpm generate-all-tokens
else
  echo "Infrastructure services are not running, skipping token generation"
  exit 1
fi
