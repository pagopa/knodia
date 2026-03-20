#!/bin/bash

# --wait exits 1 when init containers (flyway, debezium-setup, etc.) exit,
# even with exit code 0. This is expected, so we suppress it.
# See: https://github.com/docker/compose/issues/10596.
docker compose -f docker/compose.multinode.yaml up -d --wait --build || true

# Verify that all long-running services (labeled knodia.check.on.startup=true)
# are in a running state. Init containers (flyway, debezium-setup, minio-setup,
# local-kms-setup) are expected to exit and are not checked.
failed=0
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
done < <(docker ps -a \
  --filter "label=com.docker.compose.project=knodia-multinode" \
  --filter "label=knodia.check.on.startup=true" \
  --format '{{.Label "com.docker.compose.service"}}\t{{.Status}}')

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
echo "    k2k-gateway:                http://localhost:3101"
echo "    remote-resources-manager:   http://localhost:4901"
echo "    bff:                        http://localhost:3601"
echo ""
echo "  Lynx:"
echo "    frontend:                   http://localhost:5002/ui/"
echo "    eservice-process:           http://localhost:3002"
echo "    agreement-process:          http://localhost:3202"
echo "    purpose-process:            http://localhost:3502"
echo "    k2k-gateway:                http://localhost:3102"
echo "    remote-resources-manager:   http://localhost:4902"
echo "    bff:                        http://localhost:3602"
echo ""
echo "  Shared:"
echo "    Kafka UI:          http://localhost:8084"
echo "    pgAdmin:           http://localhost:5050"
echo "    MinIO Console:     http://localhost:9001"
echo "    Debezium:          http://localhost:8083"
echo "==========================================="
