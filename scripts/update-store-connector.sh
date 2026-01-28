#!/bin/bash

URL="http://localhost:8083/connectors"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
connector_config=$(jq -c ".config" "$SCRIPT_DIR/../docker/event-store-connector.json")

response=$(curl -s -o /dev/null -w "%{http_code}\n" -X PUT \
    -H "Accept:application/json" \
    -H "Content-Type:application/json" \
    -d "$connector_config" \
    "$URL/event-store-connector/config")

if [ "$response" -eq "200" ]; then
    echo "Connector updated successfully"
    exit 0
fi
echo "Connector does not exist or failed to update"
