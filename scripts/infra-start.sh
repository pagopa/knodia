#!/bin/bash

docker compose -f docker/compose.yaml up -d --wait

CONNECTORS_URL="localhost:8083/connectors/"

# wait until debezium is available
while [[ "$(curl -s -o /dev/null -w '%{http_code}' $CONNECTORS_URL)" != "200" ]]; do
  sleep 1
done

URL="http://$CONNECTORS_URL"

# register connector (201 = created, 409 = already exists)
while true; do
  response=$(curl -s -o /dev/null -i -X POST \
    -H "Accept:application/json" \
    -H "Content-Type:application/json" \
    -w "%{http_code}\n" \
    -d "@docker/debezium/event-store-connector.json" \
    "$URL")

  if [ "$response" -eq "201" ]; then
    echo "Connector registered successfully"
    break
  elif [ "$response" -eq "409" ]; then
    echo "Connector already registered. Moving on."
    break
  fi
  sleep 1
done
