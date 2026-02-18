#!/bin/sh
set -e

NAMESPACE="${FLYWAY_PLACEHOLDERS_NAMESPACE:-local}"

echo "Starting Flyway migrations (namespace: $NAMESPACE)..."

for schema_dir in /flyway/schemas/*/; do
  schema_name=$(basename "$schema_dir")

  if [ ! -d "$schema_dir" ]; then
    continue
  fi

  sql_count=$(find "$schema_dir" -name "*.sql" -type f 2>/dev/null | wc -l)
  if [ "$sql_count" -eq 0 ]; then
    echo "No SQL migrations found for schema: $schema_name (skipping)"
    continue
  fi

  echo ""
  echo "========================================"
  echo "Migrating schema: ${NAMESPACE}_${schema_name}"
  echo "========================================"

  flyway \
    -locations="filesystem:$schema_dir" \
    -schemas="${NAMESPACE}_${schema_name}" \
    -defaultSchema="${NAMESPACE}_${schema_name}" \
    migrate

  echo "Schema ${NAMESPACE}_${schema_name} migrated successfully"
done

echo ""
echo "All schema migrations completed!"
