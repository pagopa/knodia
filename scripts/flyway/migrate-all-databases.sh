#!/bin/sh
set -e

NAMESPACE="${FLYWAY_PLACEHOLDERS_NAMESPACE}"

echo "Starting Flyway migrations (namespace: $NAMESPACE)..."

# Step 1: Create roles (cluster-wide, against postgres database)
if [ -d "/flyway/roles" ]; then
  sql_count=$(find "/flyway/roles" -name "*.sql" -type f 2>/dev/null | wc -l)
  if [ "$sql_count" -gt 0 ]; then
    echo ""
    echo "========================================"
    echo "Creating roles"
    echo "========================================"

    flyway \
      -url="jdbc:postgresql://postgres:5432/postgres" \
      -locations="filesystem:/flyway/roles" \
      -schemas="public" \
      -defaultSchema="public" \
      migrate

    echo "Roles created successfully"
  fi
fi

# Step 2: Migrate all schemas for each database
for db_dir in /flyway/databases/*/; do
  db_name=$(basename "$db_dir")

  if [ ! -d "$db_dir" ]; then
    continue
  fi

  echo ""
  echo "========================================"
  echo "Database: $db_name"
  echo "========================================"

  for schema_dir in "$db_dir"*/; do
    schema_name=$(basename "$schema_dir")

    if [ ! -d "$schema_dir" ]; then
      continue
    fi

    sql_count=$(find "$schema_dir" -name "*.sql" -type f 2>/dev/null | wc -l)
    if [ "$sql_count" -eq 0 ]; then
      echo "No SQL migrations found for schema: $schema_name (skipping)"
      continue
    fi

    echo "Migrating schema: ${NAMESPACE}_${schema_name}"

    flyway \
      -url="jdbc:postgresql://postgres:5432/$db_name" \
      -locations="filesystem:$schema_dir" \
      -schemas="${NAMESPACE}_${schema_name}" \
      -defaultSchema="${NAMESPACE}_${schema_name}" \
      -table="flyway_schema_history_${schema_name}" \
      migrate

    echo "Schema ${NAMESPACE}_${schema_name} migrated successfully"
  done
done

echo ""
echo "All migrations completed!"
