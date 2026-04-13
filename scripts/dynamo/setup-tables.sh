#!/bin/bash
# Creates DynamoDB tables defined under $TABLES_DIR/<table>.json on the local
# DynamoDB instance, and applies the optional TTL config from the sibling
# $TABLES_DIR/<table>.ttl.json file when present.
# Tables that already exist are skipped, so this script is safe to re-run.

set -e

for SCHEMA_FILE in "$TABLES_DIR"/*.json; do
  case "$SCHEMA_FILE" in
    (*.ttl.json) continue ;;
  esac

  TABLE_NAME=$(basename "$SCHEMA_FILE" .json)

  echo "Checking if table $TABLE_NAME exists..."
  if aws dynamodb describe-table --table-name "$TABLE_NAME" --endpoint-url "$DYNAMODB_CONNECTION_STRING" >/dev/null 2>&1; then
    echo "Table $TABLE_NAME already exists, skipping."
    continue
  fi

  echo "Creating table $TABLE_NAME..."
  aws dynamodb create-table \
    --cli-input-json "file://$SCHEMA_FILE" \
    --endpoint-url "$DYNAMODB_CONNECTION_STRING"

  TTL_FILE="${SCHEMA_FILE%.json}.ttl.json"
  if [ -f "$TTL_FILE" ]; then
    echo "Applying TTL config to $TABLE_NAME..."
    aws dynamodb update-time-to-live \
      --cli-input-json "file://$TTL_FILE" \
      --endpoint-url "$DYNAMODB_CONNECTION_STRING"
  fi
done
