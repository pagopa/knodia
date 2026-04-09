#!/usr/bin/env bash
set -euo pipefail

# Usage: ci-run-all.sh <flyway-image> <command> [command...]
# Runs the given Flyway command(s) on every database/schema under migration/.

FLYWAY_IMAGE="$1"; shift
COMMANDS=("$@")

declare -A DB_MAP=(
  [event-store]=event_store
  [read-model]=readmodel
  [remote-resource]=remote_resource
)

run_flyway() {
  local sql_dir="$1" db_name="$2" schema="$3" command="$4"

  sql_count=$(find "$sql_dir" -maxdepth 1 -name "*.sql" -type f 2>/dev/null | wc -l)
  if [ "$sql_count" -eq 0 ]; then
    echo "No migrations in $sql_dir, skipping"
    return
  fi

  echo "Running flyway $command on $db_name / $schema from $sql_dir"
  docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -v "$(pwd)/${sql_dir}:/flyway/sql:ro" \
    "$FLYWAY_IMAGE" \
    -url="jdbc:postgresql://host.docker.internal:5432/${db_name}" \
    -user="${PGUSER}" -password="${PGPASSWORD}" \
    -locations="filesystem:/flyway/sql" \
    -schemas="${schema}" \
    -defaultSchema="${schema}" \
    -baselineOnMigrate=true \
    -placeholders.NAMESPACE="${NAMESPACE}" \
    "$command"
}

for dir_name in "${!DB_MAP[@]}"; do
  db_name="${DB_MAP[$dir_name]}"
  base_path="migration/${dir_name}"

  if [ ! -d "$base_path" ]; then
    echo "::error::Expected migration directory not found: $base_path"
    exit 1
  fi

  subdirs=$(find "$base_path" -mindepth 1 -maxdepth 1 -type d 2>/dev/null)

  if [ -n "$subdirs" ]; then
    for schema_dir in "$base_path"/*/; do
      for cmd in "${COMMANDS[@]}"; do
        run_flyway "$schema_dir" "$db_name" "${NAMESPACE}_$(basename "$schema_dir")" "$cmd"
      done
    done
  else
    for cmd in "${COMMANDS[@]}"; do
      run_flyway "$base_path" "$db_name" "public" "$cmd"
    done
  fi
done
