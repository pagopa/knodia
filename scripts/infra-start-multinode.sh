#!/bin/bash

# Set SEQUENTIAL_BUILD=1 to build images one at a time instead of letting
# `docker compose up --build` run them in parallel — needed on hosts that
# OOM under the multinode build. Services with `image:` only (no `build:`)
# are skipped by compose.
if [ "${SEQUENTIAL_BUILD:-0}" = "1" ]; then
  for svc in $(docker compose -f docker/compose.multinode.yaml config --services); do
    docker compose -f docker/compose.multinode.yaml build "$svc" || exit 1
  done
  build_flag=()
else
  build_flag=(--build)
fi

# --wait exits 1 when init containers (flyway, debezium-setup, etc.) exit,
# even with exit code 0. This is expected, so we suppress it.
# See: https://github.com/docker/compose/issues/10596.
docker compose -f docker/compose.multinode.yaml up -d --wait "${build_flag[@]}" || true

# Verify that all long-running services (labeled knodia.check.on.startup=true)
# are in a running state. Init containers (flyway, debezium-setup, minio-setup,
# seed, local-kms-setup) are expected to exit and are not checked.
failed=0
check_output=$(docker ps -a \
  --filter "label=com.docker.compose.project=knodia-multinode" \
  --filter "label=knodia.check.on.startup=true" \
  --format '{{.Label "com.docker.compose.service"}}\t{{.Status}}')

# If `up` was skipped because of a build/start failure (swallowed by `|| true`
# above to ignore the expected init-container exit), no containers exist and
# the per-service loop below would have nothing to check — fail explicitly so
# the success banner isn't printed.
if [ -z "$check_output" ]; then
  echo "ERROR: no multinode containers found — build or compose up failed"
  failed=1
fi

while IFS= read -r line; do
  [ -z "$line" ] && continue
  name=$(echo "$line" | awk -F'\t' '{print $1}')
  status=$(echo "$line" | awk -F'\t' '{print $2}')

  if echo "$status" | grep -qi "^Up"; then
    continue
  else
    echo "ERROR: service $name is not healthy ($status)"
    failed=1
  fi
done <<< "$check_output"

if [ "$failed" -ne 0 ]; then
  echo ""
  echo "==========================================="
  echo "  Knodia Multinode Infrastructure FAILED"
  echo "==========================================="
  echo ""
  echo "  Some services did not start correctly."
  echo "  Run 'docker compose -f docker/compose.multinode.yaml ps -a' for details."
  echo "==========================================="
  exit 1
fi

echo ""
echo "==========================================="
echo "  Knodia Multinode Infrastructure Ready"
echo "==========================================="
echo ""
echo "  Orion:"
echo "    frontend:                   http://localhost:5001/ui/"
echo "    eservice-process:           http://localhost:3001"
echo "    agreement-process:          http://localhost:3201"
echo "    purpose-process:            http://localhost:3501"
echo "    keychain-process:           http://localhost:3301"
echo "    organization-process:       http://localhost:3401"
echo "    k2k-gateway:                http://localhost:3101"
echo "    remote-resources-manager:   http://localhost:4901"
echo "    bff:                        http://localhost:3601"
echo "    authorization-server:       http://localhost:3701"
echo "    signal-hub:                 http://localhost:3801"
echo "    mock-eservice:              http://localhost:9991"
echo ""
echo "  Lynx:"
echo "    frontend:                   http://localhost:5002/ui/"
echo "    eservice-process:           http://localhost:3002"
echo "    agreement-process:          http://localhost:3202"
echo "    purpose-process:            http://localhost:3502"
echo "    keychain-process:           http://localhost:3302"
echo "    organization-process:       http://localhost:3402"
echo "    k2k-gateway:                http://localhost:3102"
echo "    remote-resources-manager:   http://localhost:4902"
echo "    bff:                        http://localhost:3602"
echo "    authorization-server:       http://localhost:3702"
echo "    signal-hub:                 http://localhost:3802"
echo "    mock-eservice:              http://localhost:9992"
echo ""
echo "  Shared:"
echo "    Kafka UI:          http://localhost:8084"
echo "    pgAdmin:           http://localhost:5050"
echo "    MinIO Console:     http://localhost:9001"
echo "    Debezium:          http://localhost:8083"
echo "    DynamoDB Local:    http://localhost:8085"
echo "    local-kms:         http://localhost:4566"
echo "    local-jwks:        http://localhost:4500"
echo "    local-cognito:     http://localhost:4567"
echo "==========================================="
