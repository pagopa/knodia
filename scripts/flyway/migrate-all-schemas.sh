#!/bin/sh
set -e

echo "Starting Flyway migrations for all schemas..."

# Iterate through all subdirectories in /flyway/schemas
for schema_dir in /flyway/schemas/*/; do
  # Get the schema name from directory name
  schema_name=$(basename "$schema_dir")

  # Skip if not a directory
  if [ ! -d "$schema_dir" ]; then
    continue
  fi

  # Check if directory has SQL files
  sql_count=$(find "$schema_dir" -maxdepth 1 -name "*.sql" -type f 2>/dev/null | wc -l)
  if [ "$sql_count" -eq 0 ]; then
    echo "⚠ No SQL migrations found for schema: $schema_name (skipping)"
    continue
  fi

  echo ""
  echo "========================================"
  echo "Migrating schema: $schema_name"
  echo "Migrations directory: $schema_dir"
  echo "========================================"

  # Run Flyway migrate for this schema
  flyway \
    -locations="filesystem:$schema_dir" \
    -schemas="$schema_name" \
    migrate

  echo "✓ Schema $schema_name migrated successfully"
done

echo ""
echo "All schema migrations completed!"
