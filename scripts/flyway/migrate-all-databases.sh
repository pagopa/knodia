#!/bin/sh
set -e

NAMESPACE="${FLYWAY_PLACEHOLDERS_NAMESPACE}"

echo "Starting Flyway migrations (namespace: $NAMESPACE)..."

# Step 1: Create roles (cluster-wide, against postgres database)
if [ -d "/flyway/scripts/roles" ]; then
  sql_count=$(find "/flyway/scripts/roles" -name "*.sql" -type f 2>/dev/null | wc -l)
  if [ "$sql_count" -gt 0 ]; then
    echo ""
    echo "========================================"
    echo "Creating roles"
    echo "========================================"

    flyway \
      -url="jdbc:postgresql://postgres:5432/postgres" \
      -locations="filesystem:/flyway/scripts/roles" \
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

  # Check for flat layout: .sql files directly in db_dir
  flat_sql_count=$(find "$db_dir" -maxdepth 1 -name "*.sql" -type f 2>/dev/null | wc -l)
  subdirs=$(find "$db_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)

  if [ "$flat_sql_count" -gt 0 ] && [ "$subdirs" -gt 0 ]; then
    echo "ERROR: $db_name has both SQL files and subdirectories — ambiguous layout"
    exit 1
  fi

  if [ "$flat_sql_count" -gt 0 ]; then
    # Flat layout: run flyway once, SQL files create their own schemas (used in remote resources database)
    echo "Migrating database: $db_name (flat layout)"

    flyway \
      -url="jdbc:postgresql://postgres:5432/$db_name" \
      -locations="filesystem:$db_dir" \
      -schemas="public" \
      -defaultSchema="public" \
      migrate

    echo "Database $db_name migrated successfully"
  else
    # Subdirectory layout: one flyway run per schema subdir
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
        migrate

      echo "Schema ${NAMESPACE}_${schema_name} migrated successfully"
    done
  fi
done

echo ""
echo "All migrations completed!"
