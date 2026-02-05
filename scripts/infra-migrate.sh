#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FLYWAY_IMAGE="flyway/flyway:11"

# Local environment configuration
# In CI/production, these are supplied via environment variables or flyway.conf
LOCAL_NAMESPACE="${FLYWAY_NAMESPACE:-local}"
LOCAL_PASSWORD="${FLYWAY_DEFAULT_PASSWORD:-root}"

# Auto-detect which Docker network to use based on running containers
# Sets: DOCKER_NETWORK, ES_HOST, ES_PORT, RM_HOST, RM_PORT
detect_network_and_hosts() {
  if docker ps --format "{{.Names}}" | grep -q "^knodia-event-store$"; then
    DOCKER_NETWORK="knodia_default"
    ES_HOST="event-store"
    ES_PORT="5432"
    RM_HOST="readmodel"
    RM_PORT="5432"
  elif docker ps --format "{{.Names}}" | grep -q "pagopa-interop-event-store"; then
    DOCKER_NETWORK="pagopa-interop_default"
    ES_HOST="event-store"
    ES_PORT="5432"
    RM_HOST="readmodel-sql"
    RM_PORT="5433"
  else
    echo "Error: No supported Postgres containers found. Start the infrastructure first." >&2
    exit 1
  fi
}

detect_network_and_hosts

# Map database folder to Docker container hostname and port
db_host_for() {
  case "$1" in
    event-store) echo "$ES_HOST" ;;
    read-model)  echo "$RM_HOST" ;;
    *) echo "Error: unknown db type '$1'" >&2; return 1 ;;
  esac
}

db_port_for() {
  case "$1" in
    event-store) echo "$ES_PORT" ;;
    read-model)  echo "$RM_PORT" ;;
    *) echo "Error: unknown db type '$1'" >&2; return 1 ;;
  esac
}

run_flyway() {
  local db_type="$1"
  local schema_name="$2"
  local db_host db_port
  db_host=$(db_host_for "$db_type")
  db_port=$(db_port_for "$db_type")
  local migration_dir="$PROJECT_ROOT/migration/${db_type}/${schema_name}"

  if [ ! -d "$migration_dir" ]; then
    echo "Warning: Migration directory not found: $migration_dir — skipping."
    return 0
  fi

  echo "Applying Flyway migrations for ${db_type}/${schema_name} (network: $DOCKER_NETWORK, host: $db_host:$db_port)..."

  docker run --rm \
    --network "$DOCKER_NETWORK" \
    -v "${migration_dir}:/flyway/sql:ro" \
    "$FLYWAY_IMAGE" \
    -url="jdbc:postgresql://${db_host}:${db_port}/root" \
    -user="root" \
    -password="root" \
    -schemas="${LOCAL_NAMESPACE}_${schema_name}" \
    -defaultSchema="${LOCAL_NAMESPACE}_${schema_name}" \
    -connectRetries=5 \
    -placeholders.namespace="${LOCAL_NAMESPACE}" \
    -placeholders.default_password="${LOCAL_PASSWORD}" \
    migrate

  echo "Flyway migrations applied for ${db_type}/${schema_name}."
}

# Auto-discover and run all migration schemas for each database type
for db_type in event-store read-model; do
  db_migration_dir="$PROJECT_ROOT/migration/${db_type}"
  if [ ! -d "$db_migration_dir" ]; then
    continue
  fi

  for schema_dir in "$db_migration_dir"/*/; do
    [ -d "$schema_dir" ] || continue
    schema_name=$(basename "$schema_dir")
    run_flyway "$db_type" "$schema_name"
  done
done

echo "All Flyway migrations applied successfully."
