#!/bin/bash

# Generate RSA key pairs and JWKS files for local development
node scripts/local-kms/kms-setup.mjs

docker compose -f docker/compose.yaml up -d --wait

CONNECTORS_URL="localhost:8083/connectors"

echo "Waiting for Debezium to be available at $CONNECTORS_URL ..."
# wait until debezium is available
while [[ "$(curl -s -o /dev/null -w '%{http_code}' $CONNECTORS_URL)" != "200" ]]; do
  sleep 1
done

URL="http://$CONNECTORS_URL"

while true; do
  response=$(curl -s -o /dev/null -i -X POST \
    -H "Accept:application/json" \
    -H "Content-Type:application/json" \
    -w "%{http_code}\n" \
    -d "@docker/event-store-connector.json" \
    "$URL")

  if [ "$response" -eq "201" ]; then
    echo "Connector registered successfully"
    break
  fi
  if [ "$response" -eq "409" ]; then
    echo "Connector already registered. Moving on."
    break
  fi
  echo "Failed to register connector. Response code: $response. Retrying in 1 second..."
  sleep 1
done
