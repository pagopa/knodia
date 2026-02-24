#!/bin/bash

docker compose -f docker/compose.multinode.yaml up -d --wait --build

CONNECTORS_URL="localhost:8083/connectors"

echo "Waiting for Debezium to be available at $CONNECTORS_URL ..."
while [[ "$(curl -s -o /dev/null -w '%{http_code}' $CONNECTORS_URL)" != "200" ]]; do
  sleep 1
done

URL="http://$CONNECTORS_URL"

for connector in orion lynx; do
  echo "Registering event-store-connector-${connector}..."
  while true; do
    response=$(curl -s -o /dev/null -i -X POST \
      -H "Accept:application/json" \
      -H "Content-Type:application/json" \
      -w "%{http_code}\n" \
      -d "@docker/multinode/event-store-connector-${connector}.json" \
      "$URL")

    if [ "$response" -eq "201" ]; then
      echo "Connector ${connector} registered successfully"
      break
    fi
    if [ "$response" -eq "409" ]; then
      echo "Connector ${connector} already registered. Moving on."
      break
    fi
    echo "Failed to register connector ${connector}. Response code: $response. Retrying in 1 second..."
    sleep 1
  done
done

echo ""
echo "==========================================="
echo "  Knodia Multinode Infrastructure Ready"
echo "==========================================="
echo ""
echo "  Orion:"
echo "    eservice-process:  http://localhost:3001"
echo "    bff:               http://localhost:3601"
echo ""
echo "  Lynx:"
echo "    eservice-process:  http://localhost:3002"
echo "    bff:               http://localhost:3602"
echo ""
echo "  Shared:"
echo "    Kafka UI:          http://localhost:8084"
echo "    pgAdmin:           http://localhost:5050"
echo "    MinIO Console:     http://localhost:9001"
echo "    Debezium:          http://localhost:8083"
echo "==========================================="
